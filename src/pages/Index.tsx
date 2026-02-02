import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { NoiseStatusBadge } from '@/components/dashboard/NoiseStatusBadge';
import { RealTimeTrendChart } from '@/components/dashboard/RealTimeTrendChart';
import { WaveformChart } from '@/components/dashboard/WaveformChart';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { HistoricalTrendsChart } from '@/components/dashboard/HistoricalTrendsChart';
import { DeviceComparisonChart } from '@/components/dashboard/DeviceComparisonChart';
import {
  generateHistoricalData,
  generateNewReading,
  getLatestReadings,
  getNoiseLevel,
  DEVICES,
  NoiseReading,
} from '@/lib/mockData';
import { Volume2, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

const REFRESH_INTERVAL = 10000; // 10 seconds

const Index = () => {
  const [readings, setReadings] = useState<NoiseReading[]>(() => generateHistoricalData(15));
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [waveformOpen, setWaveformOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<NoiseReading | null>(null);

  const timezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Add new readings periodically
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setReadings((prev) => {
        const lastId = Math.max(...prev.map((r) => r.id));
        const newReadings = DEVICES.map((device, i) =>
          generateNewReading(device.id, lastId + i)
        );
        // Keep only last 15 minutes of data
        const cutoff = new Date(Date.now() - 15 * 60 * 1000);
        const filtered = prev.filter((r) => new Date(r.created_at) > cutoff);
        return [...filtered, ...newReadings];
      });
      setLastUpdated(new Date());
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = useCallback(() => {
    setReadings(generateHistoricalData(15));
    setLastUpdated(new Date());
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
      (sum, r) => sum + r.peaks.filter((p) => p > 60).length,
      0
    );

    return {
      avgDba: Number(avgDba.toFixed(1)),
      maxDba: Number(maxDba.toFixed(1)),
      peakCount,
    };
  }, [latestReadings, filteredReadings]);

  // Set selected reading for waveform when available
  useEffect(() => {
    const latest = Array.from(latestReadings.values())[0];
    if (latest && !selectedReading) {
      setSelectedReading(latest);
    }
  }, [latestReadings, selectedReading]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Trend */}
            <RealTimeTrendChart readings={readings} deviceId={selectedDeviceId || undefined} />
            
            {/* Waveform Analysis */}
            <WaveformChart
              reading={selectedReading}
              isOpen={waveformOpen}
              onToggle={() => setWaveformOpen(!waveformOpen)}
            />
          </div>

          <div className="space-y-6">
            {/* Device Comparison */}
            <DeviceComparisonChart
              readings={readings}
              onDeviceSelect={setSelectedDeviceId}
              selectedDeviceId={selectedDeviceId}
            />
            
            {/* Distribution */}
            <DistributionChart readings={readings} />
          </div>
        </div>

        {/* Historical Trends */}
        <HistoricalTrendsChart readings={readings} />
      </div>
    </div>
  );
};

export default Index;
