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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
