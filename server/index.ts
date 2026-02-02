import express from 'express';
import cors from 'cors';
import { pool } from './db';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Type definition for NoiseReading from database
interface NoiseReadingRow {
    id: number;
    device_id: string;
    max_dba: number;
    min_dba: number;
    avg_dba: number;
    stddev_dba: number;
    peaks: any; // JSON column
    created_at: Date;
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Get historical readings (default last 15 minutes, or limit by count)
app.get('/api/readings', async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 1000;

        // Fetch recent readings
        const [rows] = await pool.query<any[]>(
            `SELECT * FROM noise_readings 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [limit]
        );

        // Parse JSON fields and convert numeric strings to numbers
        const formattedRows = rows.map((row: any) => {
            const peaks = typeof row.peaks === 'string' ? JSON.parse(row.peaks) : row.peaks;
            const parsedPeaks = Array.isArray(peaks) ? peaks.map(Number) : [];

            return {
                ...row,
                max_dba: Number(row.max_dba),
                min_dba: Number(row.min_dba),
                avg_dba: Number(row.avg_dba),
                stddev_dba: Number(row.stddev_dba),
                peaks: parsedPeaks,
                created_at: row.created_at.toISOString()
            };
        });

        // Return in chronological order (oldest first) as expected by charts usually, 
        // but the frontend state update logic might expect them to just be appended.
        // The current mock data logic returns them sorted by time.
        formattedRows.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get latest readings since a given timestamp (for polling)
app.get('/api/readings/latest', async (req, res) => {
    try {
        const since = req.query.since as string;

        if (!since) {
            return res.status(400).json({ error: 'Missing since parameter' });
        }

        const sinceDate = new Date(since);

        const [rows] = await pool.query<any[]>(
            `SELECT * FROM noise_readings 
       WHERE created_at > ? 
       ORDER BY created_at ASC`,
            [sinceDate]
        );

        const formattedRows = rows.map((row: any) => {
            const peaks = typeof row.peaks === 'string' ? JSON.parse(row.peaks) : row.peaks;
            const parsedPeaks = Array.isArray(peaks) ? peaks.map(Number) : [];

            return {
                ...row,
                max_dba: Number(row.max_dba),
                min_dba: Number(row.min_dba),
                avg_dba: Number(row.avg_dba),
                stddev_dba: Number(row.stddev_dba),
                peaks: parsedPeaks,
                created_at: row.created_at.toISOString()
            };
        });
        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching latest readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get historical readings with aggregation
app.get('/api/readings/historical', async (req, res) => {
    try {
        const { range, breakdown, startDate, endDate, deviceId } = req.query;

        let startTime: Date;
        let endTime = new Date(); // This is the current server time (UTC usually in node, but let's be explicit)

        switch (range) {
            case 'last_hour':
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
                break;
            case 'today':
                // Today in UTC
                startTime = new Date(endTime);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case 'this_week':
                // Week starts Sunday in UTC
                startTime = new Date(endTime);
                const day = startTime.getUTCDay();
                startTime.setUTCDate(startTime.getUTCDate() - day);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case 'this_month':
                startTime = new Date(endTime);
                startTime.setUTCDate(1);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case 'date_range':
                if (!startDate || !endDate) {
                    return res.status(400).json({ error: 'startDate and endDate are required for date_range' });
                }
                startTime = new Date(startDate as string);
                endTime = new Date(endDate as string);
                break;
            default:
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Default last hour
        }

        let timeFormat: string;
        switch (breakdown) {
            case 'second':
                timeFormat = '%Y-%m-%dT%H:%i:%sZ';
                break;
            case 'minute':
                timeFormat = '%Y-%m-%dT%H:%i:00Z';
                break;
            case 'hour':
                timeFormat = '%Y-%m-%dT%H:00:00Z';
                break;
            case 'day':
                timeFormat = '%Y-%m-%dT00:00:00Z';
                break;
            default:
                timeFormat = '%Y-%m-%dT%H:%i:00Z'; // Default minute
        }

        let query = `
            SELECT 
                DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+00:00'), ?) as time,
                AVG(avg_dba) as avg,
                MAX(max_dba) as max,
                MIN(min_dba) as min
            FROM noise_readings 
            WHERE created_at BETWEEN ? AND ?
        `;

        const params: any[] = [timeFormat, startTime, endTime];

        if (deviceId) {
            query += ` AND device_id = ?`;
            params.push(deviceId);
        }

        query += ` GROUP BY time ORDER BY time ASC`;

        const [rows] = await pool.query<any[]>(query, params);

        // Since we don't have p95 in the database yet and calculating it in SQL is complex without percentile functions,
        // we'll approximate it or just return the existing fields for now.
        // For a more accurate p95, we'd need a subquery or a stored procedure, but let's stick to simple aggregation first.
        const formattedRows = rows.map((row: any) => ({
            time: row.time,
            avg: Number(Number(row.avg).toFixed(2)),
            max: Number(Number(row.max).toFixed(2)),
            min: Number(Number(row.min).toFixed(2)),
            p95: Number(Number(row.max).toFixed(2)) // Placeholder for now
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching historical readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
