import { useMemo, useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NoiseReading } from '@/lib/mockData'; // Keeping NoiseReading type, but will fetch from real API
import { fetchHistoricalData } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface HistoricalTrendsChartProps {
  deviceId?: string;
}

type Range = 'last_hour' | 'today' | 'this_week' | 'this_month' | 'date_range';
type Breakdown = 'second' | 'minute' | 'hour' | 'day';

const rangeOptions: { value: Range; label: string }[] = [
  { value: 'last_hour', label: 'Last Hour' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'date_range', label: 'Date Range' },
];

const breakdownOptions: { value: Breakdown; label: string; allowedRanges: Range[] }[] = [
  { value: 'second', label: 'Second', allowedRanges: ['last_hour'] },
  { value: 'minute', label: 'Minute', allowedRanges: ['last_hour', 'today'] },
  { value: 'hour', label: 'Hour', allowedRanges: ['today'] },
  { value: 'day', label: 'Day', allowedRanges: ['this_week', 'this_month', 'date_range'] },
];

export function HistoricalTrendsChart({ deviceId }: HistoricalTrendsChartProps) {
  const [range, setRange] = useState<Range>('last_hour');
  const [breakdown, setBreakdown] = useState<Breakdown>('minute');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter allowed breakdowns based on range
  const filteredBreakdownOptions = useMemo(() => {
    return breakdownOptions.filter((b) => b.allowedRanges.includes(range));
  }, [range]);

  // Adjust breakdown if current one becomes invalid when range changes
  useEffect(() => {
    const isAllowed = filteredBreakdownOptions.some((b) => b.value === breakdown);
    if (!isAllowed && filteredBreakdownOptions.length > 0) {
      setBreakdown(filteredBreakdownOptions[0].value);
    }
  }, [range, filteredBreakdownOptions, breakdown]);

  const loadData = async () => {
    if (range === 'date_range' && (!startDate || !endDate)) return;

    setIsLoading(true);
    try {
      let utcStartDate: string | undefined;
      let utcEndDate: string | undefined;

      if (range === 'date_range') {
        // Convert local YYYY-MM-DD to UTC ISO strings
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        utcStartDate = start.toISOString();

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        utcEndDate = end.toISOString();
      }

      const historicalData = await fetchHistoricalData({
        range,
        breakdown,
        startDate: utcStartDate,
        endDate: utcEndDate,
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
    loadData();
  }, [range, breakdown, deviceId, startDate, endDate]);

  const chartData = useMemo(() => {
    return data.map((item) => {
      let label = item.time;
      try {
        const date = parseISO(item.time);
        if (breakdown === 'day') {
          label = format(date, 'MMM dd');
        } else if (breakdown === 'hour') {
          label = format(date, 'HH:00');
        } else if (breakdown === 'minute') {
          label = format(date, 'HH:mm');
        } else {
          label = format(date, 'HH:mm:ss');
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
            {range === 'date_range' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[150px] h-9"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[150px] h-9"
                />
              </div>
            )}
            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
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
