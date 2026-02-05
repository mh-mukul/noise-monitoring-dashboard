import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NoiseReading, NOISE_THRESHOLDS } from '@/types';
import { formatUtcToLocal, parseUtcDate } from '@/lib/dateUtils';

interface RealTimeTrendChartProps {
  readings: NoiseReading[];
  deviceId?: string;
  loading?: boolean;
}

export function RealTimeTrendChart({ readings, deviceId, loading }: RealTimeTrendChartProps) {
  const chartData = useMemo(() => {
    let filtered = readings;
    if (deviceId) {
      filtered = readings.filter((r) => r.device_id === Number(deviceId));
    }

    // Group by timestamp and average across devices if no specific device selected
    const grouped = new Map<string, { avg: number[]; max: number[]; min: number[] }>();

    for (const reading of filtered) {
      const timeKey = reading.created_at;
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, { avg: [], max: [], min: [] });
      }
      const group = grouped.get(timeKey)!;
      group.avg.push(reading.avg_dba);
      group.max.push(reading.max_dba);
      group.min.push(reading.min_dba);
    }

    return Array.from(grouped.entries())
      .map(([time, values]) => {
        let label = time;
        try {
          label = formatUtcToLocal(time, 'HH:mm:ss');
        } catch (e) {
          // Fallback
        }
        return {
          time,
          timeLabel: label,
          avg: Number((values.avg.reduce((a, b) => a + b, 0) / values.avg.length).toFixed(1)),
          max: Math.max(...values.max),
          min: Math.min(...values.min),
        };
      })
      .sort((a, b) => parseUtcDate(a.time).getTime() - parseUtcDate(b.time).getTime())
      .slice(-90); // Last 15 minutes at 10s intervals
  }, [readings, deviceId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Noise Trend</CardTitle>
        <CardDescription>
          Average and maximum dBA levels over the last 15 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] w-full flex flex-col gap-2">
            <Skeleton className="h-full w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-avg))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-avg))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                  label={{ value: 'dBA', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                {/* Threshold reference lines */}
                <ReferenceLine
                  y={NOISE_THRESHOLDS.normal.max}
                  stroke="hsl(var(--noise-normal))"
                  strokeDasharray="5 5"
                  label={{ value: 'Normal', position: 'right', fontSize: 10, fill: 'hsl(var(--noise-normal))' }}
                />
                <ReferenceLine
                  y={NOISE_THRESHOLDS.elevated.max}
                  stroke="hsl(var(--noise-elevated))"
                  strokeDasharray="5 5"
                  label={{ value: 'Elevated', position: 'right', fontSize: 10, fill: 'hsl(var(--noise-elevated))' }}
                />
                <ReferenceLine
                  y={NOISE_THRESHOLDS.high.max}
                  stroke="hsl(var(--noise-high))"
                  strokeDasharray="5 5"
                  label={{ value: 'High', position: 'right', fontSize: 10, fill: 'hsl(var(--noise-high))' }}
                />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="none"
                  fill="url(#avgGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="hsl(var(--chart-avg))"
                  strokeWidth={2}
                  dot={false}
                  name="Average"
                />
                <Line
                  type="monotone"
                  dataKey="max"
                  stroke="hsl(var(--chart-max))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Maximum"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
