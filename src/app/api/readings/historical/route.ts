import { pool } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const range = searchParams.get("range");
        const breakdown = searchParams.get("breakdown");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const deviceId = searchParams.get("deviceId");

        let startTime: Date;
        let endTime = new Date();

        switch (range) {
            case "last_hour":
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
                break;
            case "today":
                startTime = new Date(endTime);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case "this_week":
                startTime = new Date(endTime);
                const day = startTime.getUTCDay();
                startTime.setUTCDate(startTime.getUTCDate() - day);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case "this_month":
                startTime = new Date(endTime);
                startTime.setUTCDate(1);
                startTime.setUTCHours(0, 0, 0, 0);
                break;
            case "date_range":
                if (!startDate || !endDate) {
                    return Response.json(
                        { error: "startDate and endDate are required for date_range" },
                        { status: 400 }
                    );
                }
                startTime = new Date(startDate);
                endTime = new Date(endDate);
                break;
            default:
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        }

        let timeFormat: string;
        switch (breakdown) {
            case "second":
                timeFormat = "%Y-%m-%dT%H:%i:%sZ";
                break;
            case "minute":
                timeFormat = "%Y-%m-%dT%H:%i:00Z";
                break;
            case "hour":
                timeFormat = "%Y-%m-%dT%H:00:00Z";
                break;
            case "day":
                timeFormat = "%Y-%m-%dT00:00:00Z";
                break;
            default:
                timeFormat = "%Y-%m-%dT%H:%i:00Z";
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

        const formattedRows = rows.map((row: any) => ({
            time: row.time,
            avg: Number(Number(row.avg).toFixed(2)),
            max: Number(Number(row.max).toFixed(2)),
            min: Number(Number(row.min).toFixed(2)),
            p95: Number(Number(row.max).toFixed(2)),
        }));

        return Response.json(formattedRows);
    } catch (error) {
        console.error("Error fetching historical readings:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
