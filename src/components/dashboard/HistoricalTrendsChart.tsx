import { useMemo, useState, useEffect, useRef } from 'react';
import {
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
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchHistoricalData } from '@/lib/api';
import { formatUtcToLocal } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface HistoricalTrendsChartProps {
  deviceId?: string;
}

type Range = 'last_hour' | 'today' | 'yesterday' | 'date';
type Breakdown = 'second' | 'minute' | 'hour' | 'day';

const rangeOptions: { value: Range; label: string }[] = [
  { value: 'last_hour', label: 'Last Hour' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'date', label: 'Select Date' },
];

const breakdownOptions: { value: Breakdown; label: string; allowedRanges: Range[] }[] = [
  { value: 'second', label: 'Second', allowedRanges: ['last_hour'] },
  { value: 'minute', label: 'Minute', allowedRanges: ['last_hour', 'today', 'yesterday', 'date'] },
  { value: 'hour', label: 'Hour', allowedRanges: ['today', 'yesterday', 'date'] },
  { value: 'day', label: 'Day', allowedRanges: [] },
];

export function HistoricalTrendsChart({ deviceId }: HistoricalTrendsChartProps) {
  const [filter, setFilter] = useState<Range>('last_hour');
  const [breakdown, setBreakdown] = useState<Breakdown>('minute');
  const [date, setDate] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isAdjustingBreakdown = useRef(false);

  // Filter allowed breakdowns based on range
  const filteredBreakdownOptions = useMemo(() => {
    return breakdownOptions.filter((b) => b.allowedRanges.includes(filter));
  }, [filter]);

  // Adjust breakdown if current one becomes invalid when range changes
  useEffect(() => {
    const isAllowed = filteredBreakdownOptions.some((b) => b.value === breakdown);
    if (!isAllowed && filteredBreakdownOptions.length > 0) {
      isAdjustingBreakdown.current = true;
      setBreakdown(filteredBreakdownOptions[0].value);
    }
  }, [filter, filteredBreakdownOptions, breakdown]);

  const loadData = async () => {
    if (filter === 'date' && !date) return;

    setIsLoading(true);
    try {
      const historicalData = await fetchHistoricalData({
        filter,
        breakdown,
        date,
        deviceId,
      });
      setData(historicalData);
    } catch (error) {
      toast.error('Failed to load historical trends');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip loading if we're in the middle of adjusting breakdown
    if (isAdjustingBreakdown.current) {
      isAdjustingBreakdown.current = false;
      return;
    }
    loadData();
  }, [filter, breakdown, deviceId, date]);

  const chartData = useMemo(() => {
    return data.map((item) => {
      let label = item.time;
      try {
        if (breakdown === 'day') {
          label = formatUtcToLocal(item.time, 'MMM dd');
        } else if (breakdown === 'hour') {
          label = formatUtcToLocal(item.time, 'HH:00');
        } else if (breakdown === 'minute') {
          label = formatUtcToLocal(item.time, 'HH:mm');
        } else {
          label = formatUtcToLocal(item.time, 'HH:mm:ss');
        }
      } catch (e) {
        // Fallback to raw time string
      }
      return {
        ...item,
        timeLabel: label,
      };
    });
  }, [data, breakdown]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 gap-4">
          <div>
            <CardTitle>Historical Trends</CardTitle>
            <CardDescription>
              Aggregated noise levels over the selected period
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filter === 'date' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-[150px] h-9"
                />
              </div>
            )}
            <Select value={filter} onValueChange={(v) => setFilter(v as Range)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={breakdown} onValueChange={(v) => setBreakdown(v as Breakdown)}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Breakdown" />
              </SelectTrigger>
              <SelectContent>
                {filteredBreakdownOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex flex-col gap-2">
              <Skeleton className="h-full w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histAvgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
                  tickFormatter={(val) => `${val} dB`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="none"
                  fill="url(#histAvgGradient)"
                  name="Average"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  name="Average"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="max"
                  stroke="hsl(var(--chart-max))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Maximum"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="min"
                  stroke="hsl(var(--chart-min))"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  name="Minimum"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              No data available for the selected period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
