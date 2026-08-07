import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

import { isAdminRole } from '@/lib/authorization';

describe('isAdminRole', () => {
    it('returns true for ADMIN', () => {
        expect(isAdminRole('ADMIN')).toBe(true);
    });

    it('returns false for VIEWER', () => {
        expect(isAdminRole('VIEWER')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isAdminRole(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isAdminRole(undefined)).toBe(false);
    });
});
