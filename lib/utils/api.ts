export const API_BASE = '/api';
export const API_REALTIME_BASE = '/api/realtime';

/**
 * Selects the correct base URL based on operation type
 * @param endpoint - The API endpoint (e.g., '/batches/upload')
 * @param isRealtime - Whether to use the Real-time lane (default: false)
 * @returns Full API URL (e.g., '/api/realtime/batches/upload')
 */
export const getApiUrl = (endpoint: string, isRealtime = false) => {
    const base = isRealtime ? API_REALTIME_BASE : API_BASE;
    // Ensure endpoint doesn't start with /api if we are appending to base
    const cleanEndpoint = endpoint.replace(/^\/api/, '');
    // Ensure cleanEndpoint starts with / if base doesn't end with /
    const separator = base.endsWith('/') || cleanEndpoint.startsWith('/') ? '' : '/';

    return `${base}${separator}${cleanEndpoint}`;
};
