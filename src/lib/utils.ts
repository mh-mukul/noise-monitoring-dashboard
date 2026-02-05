import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { NoiseReading } from '@/types';

import { parseUtcDate } from '@/lib/dateUtils';

// Get latest reading per device
export function getLatestReadings(readings: NoiseReading[]): Map<number, NoiseReading> {
  const latest = new Map<number, NoiseReading>();

  for (const reading of readings) {
    const existing = latest.get(reading.device_id);
    if (!existing || parseUtcDate(reading.created_at) > parseUtcDate(existing.created_at)) {
      latest.set(reading.device_id, reading);
    }
  }

  return latest;
}
