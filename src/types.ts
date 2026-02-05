export interface Device {
    id: number;
    code: string;
    team_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface NoiseReading {
    id: number;
    device_id: number; // Backend is int
    device_type: string;
    ts: number;
    dba: number; // Frontend used dba/max_dba/min_dba etc. Backend NoiseReading has dba, peak, max_dba, min_dba, avg_dba, stddev_dba
    peak: number;
    max_dba: number;
    min_dba: number;
    avg_dba: number;
    stddev_dba: number;
    count: number;
    peaks: number[];
    created_at: string;
}

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
