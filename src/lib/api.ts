import Cookies from 'js-cookie';
import { NoiseReading, Device } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Helper to get headers with auth token
const getHeaders = () => {
    const token = Cookies.get('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export async function login(phone: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.detail || 'Login failed');
    }

    const data = await response.json();

    const { access_token } = data.data;
    Cookies.set('token', access_token, { expires: 7 }); // Expires in 7 days
}

export function logout() {
    Cookies.remove('token');
    window.location.href = '/login';
}

export async function fetchReadings(minutes: number = 15): Promise<NoiseReading[]> {
    const response = await fetch(`${API_BASE_URL}/readings?minutes=${minutes}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error('Failed to fetch readings');
    }
    const json = await response.json();
    return json.data;
}

export async function fetchLatestReadings(since: Date): Promise<NoiseReading[]> {
    const response = await fetch(`${API_BASE_URL}/readings/latest?since=${since.toISOString()}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error('Failed to fetch latest readings');
    }
    const json = await response.json();
    return json.data;
}

export interface HistoricalParams {
    filter: string;
    breakdown: string;
    date?: string;
    deviceId?: string;
}

export async function fetchHistoricalData(params: HistoricalParams): Promise<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}/readings/historical?${queryParams.toString()}`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error('Failed to fetch historical data');
    }
    const json = await response.json();
    return json.data;
}

export async function fetchDevices(): Promise<Device[]> {
    const response = await fetch(`${API_BASE_URL}/devices`, {
        headers: getHeaders(),
    });
    if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error('Failed to fetch devices');
    }
    const json = await response.json();
    // API returns { data: { devices: [...], pagination: {...} } } based on device.py
    return json.data.devices;
}
