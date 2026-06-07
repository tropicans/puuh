import { describe, it, expect } from 'vitest';
import { compareTexts, getDiffSummary } from '@/lib/diff-engine';

describe('Diff Engine - compareTexts', () => {
    // A. Equal Parts / No Changes
    it('should return no changes when texts are identical', () => {
        const text = 'Undang-Undang Nomor 1 Tahun 2024';
        const result = compareTexts(text, text);
        
        expect(result.hasChanges).toBe(false);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([
            { type: 'equal', value: text }
        ]);
    });

    // B. Word Additions (Inserts)
    it('should detect word additions at the end of text', () => {
        const oldText = 'Saya makan';
        const newText = 'Saya makan nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.deletedCount).toBe(0);
        // Note: addedCount is 2 because the space ' ' and 'nasi' are separate tokens
        expect(result.addedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya makan' },
            { type: 'insert', value: ' nasi' }
        ]);
    });

    it('should detect word additions in the middle of text', () => {
        const oldText = 'Saya nasi';
        const newText = 'Saya makan nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.deletedCount).toBe(0);
        // 'makan ' (tokens: 'makan', ' ') is added
        expect(result.addedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya ' },
            { type: 'insert', value: 'makan ' },
            { type: 'equal', value: 'nasi' }
        ]);
    });

    // C. Word Deletions (Deletes)
    it('should detect word deletions at the end of text', () => {
        const oldText = 'Saya makan nasi';
        const newText = 'Saya makan';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(0);
        // ' nasi' (tokens: ' ', 'nasi') is deleted
        expect(result.deletedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya makan' },
            { type: 'delete', value: ' nasi' }
        ]);
    });

    // D. Mixed Changes (Replacements)
    it('should handle replacements (mixed additions and deletions) in the middle', () => {
        const oldText = 'Saya makan nasi';
        const newText = 'Saya minum nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1); // 'minum'
        expect(result.deletedCount).toBe(1); // 'makan'
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya ' },
            { type: 'delete', value: 'makan' },
            { type: 'insert', value: 'minum' },
            { type: 'equal', value: ' nasi' }
        ]);
    });

    // E. Empty Input Boundaries
    it('should handle comparison of two empty inputs', () => {
        const result = compareTexts('', '');
        
        expect(result.hasChanges).toBe(false);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([]);
    });

    it('should handle addition transition from empty to non-empty', () => {
        const result = compareTexts('', 'Undang-Undang');
        
        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1); // 'Undang-Undang' is parsed as a single token since hyphen isn't punctuation boundary
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([
            { type: 'insert', value: 'Undang-Undang' }
        ]);
    });

    it('should handle deletion transition from non-empty to empty', () => {
        const result = compareTexts('Undang-Undang', '');
        
        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(1);
        expect(result.parts).toEqual([
            { type: 'delete', value: 'Undang-Undang' }
        ]);
    });

    // F. Case Sensitivity Handling
    it('should treat case variations as combined delete and insert operations', () => {
        const oldText = 'Lembaga';
        const newText = 'lembaga';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1);
        expect(result.deletedCount).toBe(1);
        expect(result.parts).toEqual([
            { type: 'delete', value: 'Lembaga' },
            { type: 'insert', value: 'lembaga' }
        ]);
    });
});

describe('Diff Engine - getDiffSummary', () => {
    it('should return "Tidak ada perubahan" when there are no differences', () => {
        const summary = getDiffSummary('Presiden menetapkan', 'Presiden menetapkan');
        expect(summary).toBe('Tidak ada perubahan');
    });

    it('should return additions summary only', () => {
        const summary = getDiffSummary('Presiden menetapkan', 'Presiden menetapkan peraturan');
        expect(summary).toBe('+2 kata ditambahkan'); // space + 'peraturan'
    });

    it('should return deletions summary only', () => {
        const summary = getDiffSummary('Presiden menetapkan peraturan', 'Presiden menetapkan');
        expect(summary).toBe('-2 kata dihapus'); // space + 'peraturan'
    });

    it('should return combined summary for replacements', () => {
        const summary = getDiffSummary('Presiden menetapkan peraturan', 'Presiden mengubah peraturan');
        expect(summary).toBe('+1 kata ditambahkan, -1 kata dihapus');
    });
});
