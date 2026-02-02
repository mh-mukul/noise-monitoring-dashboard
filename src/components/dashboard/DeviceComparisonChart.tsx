import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoiseReading, DEVICES, getNoiseLevel } from '@/lib/mockData';

interface DeviceComparisonChartProps {
  readings: NoiseReading[];
  onDeviceSelect?: (deviceId: string | null) => void;
  selectedDeviceId?: string | null;
}

type MetricType = 'avg' | 'max' | 'peaks';

const barColors = {
  normal: 'hsl(var(--noise-normal))',
  elevated: 'hsl(var(--noise-elevated))',
  high: 'hsl(var(--noise-high))',
  critical: 'hsl(var(--noise-critical))',
};

export function DeviceComparisonChart({ 
  readings, 
  onDeviceSelect,
  selectedDeviceId 
}: DeviceComparisonChartProps) {
  const [metric, setMetric] = useState<MetricType>('avg');

  const chartData = useMemo(() => {
    const deviceStats = new Map<string, { 
      avgValues: number[]; 
      maxValues: number[];
      peakCount: number;
    }>();

    for (const reading of readings) {
      if (!deviceStats.has(reading.device_id)) {
        deviceStats.set(reading.device_id, { 
          avgValues: [], 
          maxValues: [],
          peakCount: 0,
        });
      }
      const stats = deviceStats.get(reading.device_id)!;
      stats.avgValues.push(reading.avg_dba);
      stats.maxValues.push(reading.max_dba);
      // Count peaks above 60 dBA
      stats.peakCount += reading.peaks.filter(p => p > 60).length;
    }

    return DEVICES.map((device) => {
      const stats = deviceStats.get(device.id);
      if (!stats || stats.avgValues.length === 0) {
        return {
          id: device.id,
          name: device.name.replace('Sensor ', ''),
          fullName: device.name,
          location: device.location,
          avg: 0,
          max: 0,
          peaks: 0,
          level: 'normal' as const,
        };
      }

      const avg = stats.avgValues.reduce((a, b) => a + b, 0) / stats.avgValues.length;
      const max = Math.max(...stats.maxValues);

      return {
        id: device.id,
        name: device.name.replace('Sensor ', ''),
        fullName: device.name,
        location: device.location,
        avg: Number(avg.toFixed(1)),
        max: Number(max.toFixed(1)),
        peaks: stats.peakCount,
        level: getNoiseLevel(avg),
      };
    }).sort((a, b) => b[metric] - a[metric]);
  }, [readings, metric]);

  const handleBarClick = (data: { id: string }) => {
    if (onDeviceSelect) {
      onDeviceSelect(selectedDeviceId === data.id ? null : data.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Device Comparison</CardTitle>
            <CardDescription>
              Compare noise levels across all sensors
            </CardDescription>
          </div>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
            <TabsList>
              <TabsTrigger value="avg">Avg dBA</TabsTrigger>
              <TabsTrigger value="max">Max dBA</TabsTrigger>
              <TabsTrigger value="peaks">Peak Count</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={metric === 'peaks' ? [0, 'auto'] : [0, 100]}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
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
                        <span>{data.avg} dBA</span>
                        <span className="text-muted-foreground">Max:</span>
                        <span>{data.max} dBA</span>
                        <span className="text-muted-foreground">Peaks &gt;60:</span>
                        <span>{data.peaks}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey={metric}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data)}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={barColors[entry.level]}
                    opacity={selectedDeviceId && selectedDeviceId !== entry.id ? 0.4 : 1}
                    stroke={selectedDeviceId === entry.id ? 'hsl(var(--foreground))' : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Click a bar to filter dashboard by device
        </p>
      </CardContent>
    </Card>
  );
}
