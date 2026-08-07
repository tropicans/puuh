import { describe, it, expect } from 'vitest';
import { compareTexts, getDiffSummary } from '@/lib/diff-engine';

describe('compareTexts', () => {
    it('detects no change', () => {
        const result = compareTexts('Pasal 1 sama', 'Pasal 1 sama');
        expect(result.hasChanges).toBe(false);
    });

    it('detects additions', () => {
        const result = compareTexts('Pasal 1', 'Pasal 1 telah diubah');
        expect(result.addedCount).toBeGreaterThan(0);
        expect(result.hasChanges).toBe(true);
    });

    it('detects deletions', () => {
        const result = compareTexts('Pasal 1 yang lama dihapus', 'Pasal 1');
        expect(result.deletedCount).toBeGreaterThan(0);
        expect(result.hasChanges).toBe(true);
    });

    it('handles empty old text', () => {
        const result = compareTexts('', 'Pasal baru');
        expect(result.addedCount).toBeGreaterThan(0);
    });

    it('handles empty new text', () => {
        const result = compareTexts('Pasal lama', '');
        expect(result.deletedCount).toBeGreaterThan(0);
    });

    it('returns diff parts array', () => {
        const result = compareTexts('kalimat pertama.', 'kalimat kedua.');
        expect(Array.isArray(result.parts)).toBe(true);
        expect(result).toHaveProperty('hasChanges');
        expect(result).toHaveProperty('addedCount');
        expect(result).toHaveProperty('deletedCount');
    });
});

describe('getDiffSummary', () => {
    it('returns no change for identical text', () => {
        expect(getDiffSummary('sama', 'sama')).toBe('Tidak ada perubahan');
    });

    it('returns change summary for different text', () => {
        const result = getDiffSummary('teks lama', 'teks baru');
        expect(result).not.toBe('Tidak ada perubahan');
    });
});
