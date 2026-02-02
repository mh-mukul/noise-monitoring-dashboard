import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NoiseReading, DEVICES } from '@/lib/mockData';

interface DistributionChartProps {
  readings: NoiseReading[];
}

export function DistributionChart({ readings }: DistributionChartProps) {
  const chartData = useMemo(() => {
    // Group readings by device and calculate aggregated stats
    const deviceStats = new Map<string, { 
      avgValues: number[]; 
      stddevValues: number[];
      minValues: number[];
      maxValues: number[];
    }>();

    for (const reading of readings) {
      if (!deviceStats.has(reading.device_id)) {
        deviceStats.set(reading.device_id, { 
          avgValues: [], 
          stddevValues: [],
          minValues: [],
          maxValues: [],
        });
      }
      const stats = deviceStats.get(reading.device_id)!;
      stats.avgValues.push(reading.avg_dba);
      stats.stddevValues.push(reading.stddev_dba);
      stats.minValues.push(reading.min_dba);
      stats.maxValues.push(reading.max_dba);
    }

    return DEVICES.map((device) => {
      const stats = deviceStats.get(device.id);
      if (!stats || stats.avgValues.length === 0) {
        return {
          name: device.name.replace('Sensor ', ''),
          avg: 0,
          errorLow: 0,
          errorHigh: 0,
          stddev: 0,
        };
      }

      const overallAvg = stats.avgValues.reduce((a, b) => a + b, 0) / stats.avgValues.length;
      const avgStdDev = stats.stddevValues.reduce((a, b) => a + b, 0) / stats.stddevValues.length;
      const minVal = Math.min(...stats.minValues);
      const maxVal = Math.max(...stats.maxValues);

      return {
        name: device.name.replace('Sensor ', ''),
        fullName: device.name,
        location: device.location,
        avg: Number(overallAvg.toFixed(1)),
        errorLow: Number((overallAvg - minVal).toFixed(1)),
        errorHigh: Number((maxVal - overallAvg).toFixed(1)),
        stddev: Number(avgStdDev.toFixed(1)),
        min: minVal,
        max: maxVal,
      };
    });
  }, [readings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution & Variability</CardTitle>
        <CardDescription>
          Average dBA with min/max range per device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 80]}
                label={{ value: 'dBA', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'avg') return [`${value} dBA`, 'Average'];
                  return [value, name];
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card p-3 border rounded-lg shadow-md">
                      <p className="font-medium">{data.fullName}</p>
                      <p className="text-xs text-muted-foreground mb-2">{data.location}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Avg:</span>
                        <span className="font-medium">{data.avg} dBA</span>
                        <span className="text-muted-foreground">Min:</span>
                        <span>{data.min} dBA</span>
                        <span className="text-muted-foreground">Max:</span>
                        <span>{data.max} dBA</span>
                        <span className="text-muted-foreground">StdDev:</span>
                        <span>±{data.stddev}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="avg"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              >
                <ErrorBar
                  dataKey="errorHigh"
                  width={4}
                  strokeWidth={2}
                  stroke="hsl(var(--foreground))"
                  direction="y"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
