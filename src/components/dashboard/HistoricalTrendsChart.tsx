import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoiseReading, aggregateByTimeBucket } from '@/lib/mockData';
import { format } from 'date-fns';

interface HistoricalTrendsChartProps {
  readings: NoiseReading[];
}

type BucketSize = '1min' | '5min' | '1hour' | '1day';

const bucketMinutes: Record<BucketSize, number> = {
  '1min': 1,
  '5min': 5,
  '1hour': 60,
  '1day': 1440,
};

export function HistoricalTrendsChart({ readings }: HistoricalTrendsChartProps) {
  const [bucketSize, setBucketSize] = useState<BucketSize>('1min');

  const chartData = useMemo(() => {
    const aggregated = aggregateByTimeBucket(readings, bucketMinutes[bucketSize]);
    
    return aggregated.map((item) => ({
      ...item,
      timeLabel: format(new Date(item.time), bucketSize === '1day' ? 'MMM dd' : 'HH:mm'),
    }));
  }, [readings, bucketSize]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Historical Trends</CardTitle>
            <CardDescription>
              Aggregated noise levels over time
            </CardDescription>
          </div>
          <Tabs value={bucketSize} onValueChange={(v) => setBucketSize(v as BucketSize)}>
            <TabsList>
              <TabsTrigger value="1min">1 min</TabsTrigger>
              <TabsTrigger value="5min">5 min</TabsTrigger>
              <TabsTrigger value="1hour" disabled>1 hour</TabsTrigger>
              <TabsTrigger value="1day" disabled>1 day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="histAvgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="none"
                fill="url(#histAvgGradient)"
                name="Average"
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--chart-1))"
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
              <Line
                type="monotone"
                dataKey="p95"
                stroke="hsl(var(--chart-4))"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
                name="95th Percentile"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Note: Hourly and daily aggregations require rollup tables (not yet implemented)
        </p>
      </CardContent>
    </Card>
  );
}
