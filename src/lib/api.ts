import { NoiseReading } from './mockData';

const API_BASE_URL = 'http://localhost:3001/api';

export async function fetchReadings(limit: number = 1000): Promise<NoiseReading[]> {
    const response = await fetch(`${API_BASE_URL}/readings?limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch readings');
    }
    return response.json();
}

export async function fetchLatestReadings(since: Date): Promise<NoiseReading[]> {
    const response = await fetch(`${API_BASE_URL}/readings/latest?since=${since.toISOString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch latest readings');
    }
    return response.json();
}

export interface HistoricalParams {
    range: string;
    breakdown: string;
    startDate?: string;
    endDate?: string;
    deviceId?: string;
}

export async function fetchHistoricalData(params: HistoricalParams): Promise<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/readings/historical?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch historical data');
    }
    return response.json();
}
