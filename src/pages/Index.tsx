import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { NoiseStatusBadge } from '@/components/dashboard/NoiseStatusBadge';
import { RealTimeTrendChart } from '@/components/dashboard/RealTimeTrendChart';
import { HistoricalTrendsChart } from '@/components/dashboard/HistoricalTrendsChart';
import {
  getLatestReadings,
  getNoiseLevel,
  NoiseReading,
} from '@/lib/mockData';
import { fetchReadings, fetchLatestReadings } from '@/lib/api';
import { Volume2, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { toast } from 'sonner';

const REFRESH_INTERVAL = 10000; // 10 seconds

const Index = () => {
  const [readings, setReadings] = useState<NoiseReading[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchReadings(2000); // Fetch enough history
        setReadings(data);
        setLastUpdated(new Date());
      } catch (error) {
        toast.error('Failed to load noise readings');
        console.error(error);
      }
    };
    loadData();
  }, []);

  // Add new readings periodically
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        const latestTime = readings.length > 0
          ? new Date(readings[readings.length - 1].created_at)
          : new Date(Date.now() - 60000); // Default to 1 min ago if empty

        const newReadings = await fetchLatestReadings(latestTime);

        if (newReadings.length > 0) {
          setReadings((prev) => {
            // Append and keep only last 15 minutes of data approx? 
            // Or maybe just keeping last N items is better for performance?
            // Let's keep 4000 items to be safe for charts.
            const allReadings = [...prev, ...newReadings];
            // Sort to ensure order
            allReadings.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return allReadings.slice(-4000);
          });
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch new readings', error);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, readings]);

  const handleRefresh = useCallback(async () => {
    try {
      const data = await fetchReadings(2000);
      setReadings(data);
      setLastUpdated(new Date());
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  }, []);

  // Filter readings by device if selected
  const filteredReadings = useMemo(() => {
    if (!selectedDeviceId) return readings;
    return readings.filter((r) => r.device_id === selectedDeviceId);
  }, [readings, selectedDeviceId]);

  // Get latest readings for KPIs
  const latestReadings = useMemo(() => {
    return getLatestReadings(filteredReadings);
  }, [filteredReadings]);

  // Calculate KPI values
  const kpiData = useMemo(() => {
    const allLatest = Array.from(latestReadings.values());
    if (allLatest.length === 0) {
      return { avgDba: 0, maxDba: 0, peakCount: 0 };
    }

    const avgDba = allLatest.reduce((sum, r) => sum + r.avg_dba, 0) / allLatest.length;
    const maxDba = Math.max(...allLatest.map((r) => r.max_dba));

    // Count peaks above 60 dBA in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReadings = filteredReadings.filter(
      (r) => new Date(r.created_at) > fiveMinAgo
    );
    const peakCount = recentReadings.reduce(
      (sum, r) => {
        // Handle cases where peaks might be null or undefined if DB data is impartial
        if (!r.peaks || !Array.isArray(r.peaks)) return sum;
        return sum + r.peaks.filter((p) => p > 60).length;
      },
      0
    );

    return {
      avgDba: Number(avgDba.toFixed(1)),
      maxDba: Number(maxDba.toFixed(1)),
      peakCount,
    };
  }, [latestReadings, filteredReadings]);

  const noiseLevel = getNoiseLevel(kpiData.avgDba);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <DashboardHeader
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={setSelectedDeviceId}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          timezone={timezone}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Current Avg dBA"
            value={`${kpiData.avgDba} dBA`}
            subtitle="Last 10 seconds"
            icon={<Volume2 className="h-4 w-4" />}
            variant={noiseLevel}
          />
          <KPICard
            title="Current Max dBA"
            value={`${kpiData.maxDba} dBA`}
            subtitle="Last 10 seconds"
            icon={<TrendingUp className="h-4 w-4" />}
            variant={getNoiseLevel(kpiData.maxDba)}
          />
          <KPICard
            title="Noise Status"
            value={<NoiseStatusBadge dba={kpiData.avgDba} size="lg" />}
            subtitle={selectedDeviceId ? 'Selected device' : 'All devices'}
            icon={<Activity className="h-4 w-4" />}
          />
          <KPICard
            title="Peak Count"
            value={kpiData.peakCount}
            subtitle="Peaks >60 dBA (last 5 min)"
            icon={<AlertTriangle className="h-4 w-4" />}
            variant={kpiData.peakCount > 50 ? 'high' : kpiData.peakCount > 20 ? 'elevated' : 'default'}
          />
        </div>

        {/* Main Charts */}
        <div className="space-y-6">
          {/* Real-time Trend */}
          <RealTimeTrendChart readings={readings} deviceId={selectedDeviceId || undefined} />
        </div>

        {/* Historical Trends */}
        <HistoricalTrendsChart deviceId={selectedDeviceId || undefined} />
      </div>
    </div>
  );
};

export default Index;
