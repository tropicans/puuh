import { describe, it, expect } from 'vitest';
import {
    uploadSchema,
    loginSchema,
    versionSchema,
    updateVersionSchema,
    updateArticleSchema,
    createJudicialReviewSchema,
    updateJudicialReviewSchema,
} from '@/lib/validations';

describe('loginSchema', () => {
    it('accepts valid email and password', () => {
        const result = loginSchema.safeParse({ email: 'admin@test.com', password: '123456' });
        expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
        const result = loginSchema.safeParse({ email: 'not-email', password: '123456' });
        expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
        const result = loginSchema.safeParse({ email: 'a@b.com', password: '12345' });
        expect(result.success).toBe(false);
    });
});

describe('uploadSchema', () => {
    it('accepts minimum valid upload', () => {
        const result = uploadSchema.safeParse({
            regulationType: 'Perpres',
            number: '82',
            year: '2018',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid year format', () => {
        const result = uploadSchema.safeParse({
            regulationType: 'Perpres',
            number: '82',
            year: '20',
        });
        expect(result.success).toBe(false);
    });

    it('requires regulationType', () => {
        const result = uploadSchema.safeParse({
            number: '82',
            year: '2018',
        });
        expect(result.success).toBe(false);
    });
});

describe('versionSchema', () => {
    it('accepts valid version', () => {
        const result = versionSchema.safeParse({
            number: '82',
            year: 2018,
            fullTitle: 'Perpres 82/2018 tentang JKN',
            status: 'ACTIVE',
        });
        expect(result.success).toBe(true);
    });

    it('rejects year before 1945', () => {
        const result = versionSchema.safeParse({
            number: '1',
            year: 1900,
            fullTitle: 'Test',
            status: 'ACTIVE',
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
        const result = versionSchema.safeParse({
            number: '82',
            year: 2018,
            fullTitle: 'Test',
            status: 'DRAFT',
        });
        expect(result.success).toBe(false);
    });
});

describe('updateVersionSchema', () => {
    it('accepts partial update', () => {
        const result = updateVersionSchema.safeParse({ status: 'AMENDED' });
        expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
        const result = updateVersionSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('rejects unknown fields (strict)', () => {
        const result = updateVersionSchema.safeParse({ status: 'ACTIVE', foo: 'bar' });
        expect(result.success).toBe(false);
    });
});

describe('updateArticleSchema', () => {
    it('accepts content-only update', () => {
        const result = updateArticleSchema.safeParse({ content: 'Updated content' });
        expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
        const result = updateArticleSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

describe('createJudicialReviewSchema', () => {
    it('accepts valid judicial review', () => {
        const result = createJudicialReviewSchema.safeParse({
            decisionNumber: '123/PUU-XX/2022',
            amarText: 'Menyatakan pasal 1 bertentangan dengan UUD 1945 dan tidak memiliki kekuatan hukum mengikat',
            outcome: 'GRANTED',
            impacts: [{
                articleNumber: 'Pasal 1',
                disposition: 'INVALIDATED',
            }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects short amarText', () => {
        const result = createJudicialReviewSchema.safeParse({
            decisionNumber: '123/PUU-XX/2022',
            amarText: 'Pendek',
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid sourceUrl', () => {
        const result = createJudicialReviewSchema.safeParse({
            decisionNumber: '123/PUU-XX/2022',
            amarText: 'Cukup panjang untuk validasi minimum karakter',
            sourceUrl: 'not-a-url',
        });
        expect(result.success).toBe(false);
    });
});

describe('updateJudicialReviewSchema', () => {
    it('accepts partial update', () => {
        const result = updateJudicialReviewSchema.safeParse({ outcome: 'REJECTED' });
        expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
        const result = updateJudicialReviewSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});
