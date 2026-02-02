import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { NoiseReading, NOISE_THRESHOLDS } from '@/lib/mockData';
import { format } from 'date-fns';

interface WaveformChartProps {
  reading: NoiseReading | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function WaveformChart({ reading, isOpen, onToggle }: WaveformChartProps) {
  const chartData = useMemo(() => {
    if (!reading?.peaks) return [];
    
    return reading.peaks.map((value, index) => ({
      time: (index * 0.5).toFixed(1),
      dba: value,
    }));
  }, [reading]);

  if (!reading) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Waveform Analysis
          </CardTitle>
          <CardDescription>Select a time point to view peak data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Waveform Analysis
                </CardTitle>
                <CardDescription>
                  10-second window from {format(new Date(reading.created_at), 'HH:mm:ss')}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: 'Seconds', position: 'bottom', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    label={{ value: 'dBA', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} dBA`, 'Level']}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <ReferenceLine
                    y={reading.avg_dba}
                    stroke="hsl(var(--chart-avg))"
                    strokeDasharray="5 5"
                    label={{ value: `Avg: ${reading.avg_dba}`, position: 'right', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dba"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#waveformGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div className="text-center p-2 bg-accent/30 rounded-md">
                <div className="text-muted-foreground">Min</div>
                <div className="font-semibold">{reading.min_dba} dBA</div>
              </div>
              <div className="text-center p-2 bg-accent/30 rounded-md">
                <div className="text-muted-foreground">Avg</div>
                <div className="font-semibold">{reading.avg_dba} dBA</div>
              </div>
              <div className="text-center p-2 bg-accent/30 rounded-md">
                <div className="text-muted-foreground">Max</div>
                <div className="font-semibold">{reading.max_dba} dBA</div>
              </div>
              <div className="text-center p-2 bg-accent/30 rounded-md">
                <div className="text-muted-foreground">StdDev</div>
                <div className="font-semibold">±{reading.stddev_dba}</div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
