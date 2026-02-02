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
