// Mock data generator for noise monitoring dashboard
// Simulates real-time noise readings from multiple devices

export interface NoiseReading {
  id: number;
  device_id: string;
  max_dba: number;
  min_dba: number;
  avg_dba: number;
  stddev_dba: number;
  peaks: number[];
  created_at: string;
}

export interface Device {
  id: string;
  name: string;
  location: string;
}

export const DEVICES: Device[] = [
  { id: 'dev-001', name: 'Sensor Alpha', location: 'Production Floor A' },
  { id: 'dev-002', name: 'Sensor Beta', location: 'Production Floor B' },
  { id: 'dev-003', name: 'Sensor Gamma', location: 'Warehouse' },
  { id: 'dev-004', name: 'Sensor Delta', location: 'Office Area' },
];

export const NOISE_THRESHOLDS = {
  normal: { max: 35, label: 'Normal', color: 'noise-normal' },
  elevated: { max: 50, label: 'Elevated', color: 'noise-elevated' },
  high: { max: 70, label: 'High', color: 'noise-high' },
  critical: { max: Infinity, label: 'Critical', color: 'noise-critical' },
} as const;

export function getNoiseLevel(dba: number): keyof typeof NOISE_THRESHOLDS {
  if (dba < NOISE_THRESHOLDS.normal.max) return 'normal';
  if (dba < NOISE_THRESHOLDS.elevated.max) return 'elevated';
  if (dba < NOISE_THRESHOLDS.high.max) return 'high';
  return 'critical';
}

// Generate peaks for a 10-second window (20 readings at 0.5s intervals)
function generatePeaks(baseLevel: number, variance: number): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < 20; i++) {
    const spike = Math.random() < 0.1 ? Math.random() * 15 : 0;
    peaks.push(Number((baseLevel + (Math.random() - 0.5) * variance + spike).toFixed(2)));
  }
  return peaks;
}

// Generate a single noise reading
function generateReading(deviceId: string, timestamp: Date, id: number): NoiseReading {
  // Different devices have different noise profiles
  const deviceProfiles: Record<string, { base: number; variance: number }> = {
    'dev-001': { base: 55, variance: 20 },
    'dev-002': { base: 45, variance: 15 },
    'dev-003': { base: 38, variance: 10 },
    'dev-004': { base: 28, variance: 8 },
  };

  const profile = deviceProfiles[deviceId] || { base: 40, variance: 12 };
  const peaks = generatePeaks(profile.base, profile.variance);
  
  const max_dba = Math.max(...peaks);
  const min_dba = Math.min(...peaks);
  const avg_dba = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  const stddev_dba = Math.sqrt(peaks.reduce((sum, p) => sum + Math.pow(p - avg_dba, 2), 0) / peaks.length);

  return {
    id,
    device_id: deviceId,
    max_dba: Number(max_dba.toFixed(2)),
    min_dba: Number(min_dba.toFixed(2)),
    avg_dba: Number(avg_dba.toFixed(2)),
    stddev_dba: Number(stddev_dba.toFixed(2)),
    peaks,
    created_at: timestamp.toISOString(),
  };
}

// Generate historical data for the last N minutes
export function generateHistoricalData(minutes: number = 15): NoiseReading[] {
  const readings: NoiseReading[] = [];
  const now = new Date();
  let id = 1;

  for (let m = minutes; m >= 0; m--) {
    for (let s = 50; s >= 0; s -= 10) {
      const timestamp = new Date(now.getTime() - m * 60000 - s * 1000);
      for (const device of DEVICES) {
        readings.push(generateReading(device.id, timestamp, id++));
      }
    }
  }

  return readings.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// Generate a single new reading for real-time updates
export function generateNewReading(deviceId: string, lastId: number): NoiseReading {
  return generateReading(deviceId, new Date(), lastId + 1);
}

// Get latest reading per device
export function getLatestReadings(readings: NoiseReading[]): Map<string, NoiseReading> {
  const latest = new Map<string, NoiseReading>();
  
  for (const reading of readings) {
    const existing = latest.get(reading.device_id);
    if (!existing || new Date(reading.created_at) > new Date(existing.created_at)) {
      latest.set(reading.device_id, reading);
    }
  }
  
  return latest;
}

// Aggregate readings for time buckets
export function aggregateByTimeBucket(
  readings: NoiseReading[],
  bucketMinutes: number = 1
): { time: string; avg: number; max: number; min: number; p95: number }[] {
  const buckets = new Map<string, number[]>();

  for (const reading of readings) {
    const date = new Date(reading.created_at);
    const bucketTime = new Date(
      Math.floor(date.getTime() / (bucketMinutes * 60000)) * bucketMinutes * 60000
    );
    const key = bucketTime.toISOString();
    
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(reading.avg_dba);
  }

  return Array.from(buckets.entries())
    .map(([time, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return {
        time,
        avg: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
        max: Math.max(...values),
        min: Math.min(...values),
        p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
      };
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
