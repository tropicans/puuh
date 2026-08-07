import { getCurrentUser } from './authorization';
import { logger } from './logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3007';

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number>;
}

export async function fetchFromBackend<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
    try {
        const user = await getCurrentUser();
        const headers = new Headers(options.headers || {});
        
        if (user) {
            headers.set('X-User-Id', user.id);
            headers.set('X-User-Role', user.role);
        }

        if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        // Build URL with query params
        const url = new URL(`${BACKEND_URL}${endpoint}`);
        if (options.params) {
            Object.entries(options.params).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    url.searchParams.append(key, String(val));
                }
            });
        }

        const response = await fetch(url.toString(), {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}`;
            try {
                const errData = await response.json();
                errorMessage = errData.error || errData.message || errorMessage;
            } catch {
                // ignore
            }
            return { success: false, error: errorMessage, status: response.status };
        }

        const data = await response.json();
        return { success: true, data, status: response.status };
    } catch (error) {
        logger.error(`Error fetching from backend at ${endpoint}:`, error);
        return { success: false, error: 'Terjadi kesalahan jaringan atau server', status: 500 };
    }
}
