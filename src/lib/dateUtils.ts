import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Returns the UTC ISO string for the start of the given date in LOCAL time.
 * Example: Input 2023-10-05 (Local) -> Output 2023-10-04T18:30:00.000Z (if UTC+5:30)
 */
export function getLocalDateStartAsUtc(date: Date): string {
    const start = startOfDay(date);
    return start.toISOString();
}

/**
 * Returns the UTC ISO string for the end of the given date in LOCAL time.
 * Example: Input 2023-10-05 (Local) -> Output 2023-10-05T18:29:59.999Z (if UTC+5:30)
 */
export function getLocalDateEndAsUtc(date: Date): string {
    const end = endOfDay(date);
    return end.toISOString();
}

/**
 * Formats a UTC date string to a local time string using the specified format.
 * @param utcDateString ISO string from backend (e.g., '2023-10-05T10:00:00Z')
 * @param formatStr date-fns format string (e.g., 'HH:mm')
 */
export function formatUtcToLocal(utcDateString: string, formatStr: string): string {
    const date = parseUtcDate(utcDateString);
    return format(date, formatStr);
}

/**
 * Parses a UTC date string into a Date object, handling naive strings (missing Z) by treating them as UTC.
 */
export function parseUtcDate(utcDateString: string): Date {
    let parseString = utcDateString;
    if (!utcDateString.endsWith('Z') && !utcDateString.includes('+')) {
        parseString += 'Z';
    }
    return new Date(parseString);
}
