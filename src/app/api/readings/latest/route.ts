import { pool } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const since = searchParams.get("since");

        if (!since) {
            return Response.json({ error: "Missing since parameter" }, { status: 400 });
        }

        const sinceDate = new Date(since);

        const [rows] = await pool.query<any[]>(
            `SELECT * FROM noise_readings 
       WHERE created_at > ? 
       ORDER BY created_at ASC`,
            [sinceDate]
        );

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

        return Response.json(formattedRows);
    } catch (error) {
        console.error("Error fetching latest readings:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
