import { pool } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get("limit")
            ? Number(searchParams.get("limit"))
            : 1000;

        // Fetch recent readings
        const [rows] = await pool.query<any[]>(
            `SELECT * FROM noise_readings 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [limit]
        );

        // Parse JSON fields and convert numeric strings to numbers
        const formattedRows = rows.map((row: any) => {
            const peaks =
                typeof row.peaks === "string" ? JSON.parse(row.peaks) : row.peaks;
            const parsedPeaks = Array.isArray(peaks) ? peaks.map(Number) : [];

            return {
                ...row,
                max_dba: Number(row.max_dba),
                min_dba: Number(row.min_dba),
                avg_dba: Number(row.avg_dba),
                stddev_dba: Number(row.stddev_dba),
                peaks: parsedPeaks,
                created_at: row.created_at.toISOString(),
            };
        });

        // Return in chronological order (oldest first)
        formattedRows.sort(
            (a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return Response.json(formattedRows);
    } catch (error) {
        console.error("Error fetching readings:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
