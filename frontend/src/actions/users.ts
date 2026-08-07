'use server';

import { fetchFromBackend } from '@/lib/api';

interface SeedUserResult {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Seeds a bootstrap admin user if no users exist in the database.
 */
export async function seedAdminUser(): Promise<SeedUserResult> {
    const res = await fetchFromBackend<SeedUserResult>('/api/users/seed-admin', {
        method: 'POST'
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to seed users' };
    }
    return res.data;
}

/**
 * Get all users (admin only - for user management)
 */
export async function getUsers() {
    const res = await fetchFromBackend<any[]>('/api/users', {
        method: 'GET'
    });
    if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to fetch users' };
    }
    return res.data;
}
