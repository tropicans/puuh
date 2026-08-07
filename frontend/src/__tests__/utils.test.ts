import { describe, it, expect } from 'vitest';
import { cn, formatDate, getStatusColor, getStatusLabel, cleanPdfText, cleanMarkdownText } from '@/lib/utils';

describe('cn', () => {
    it('merges class names', () => {
        expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'hidden', 'active')).toBe('base active');
    });

    it('resolves tailwind conflicts', () => {
        expect(cn('px-4', 'px-2')).toBe('px-2');
    });
});

describe('formatDate', () => {
    it('formats a valid date string', () => {
        const result = formatDate('2020-05-05');
        expect(result).toContain('2020');
    });

    it('formats Indonesian locale', () => {
        const result = formatDate('2020-01-01');
        expect(result).toContain('Januari');
    });
});

describe('getStatusColor', () => {
    it('returns color class string for active', () => {
        expect(getStatusColor('active')).toContain('emerald');
    });

    it('returns color class string for revoked', () => {
        expect(getStatusColor('revoked')).toContain('red');
    });

    it('returns default for unknown status', () => {
        expect(getStatusColor('UNKNOWN')).toContain('gray');
    });
});

describe('getStatusLabel', () => {
    it('returns label for active (lowercase)', () => {
        expect(getStatusLabel('active')).toBe('Berlaku');
    });

    it('returns label for amended (lowercase)', () => {
        expect(getStatusLabel('amended')).toBe('Diubah');
    });

    it('returns label for revoked (lowercase)', () => {
        expect(getStatusLabel('revoked')).toBe('Dicabut');
    });

    it('returns status as-is for unknown', () => {
        expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    });
});

describe('cleanPdfText', () => {
    it('removes page numbers', () => {
        const input = '- 12 -\nIsi pasal\n- 13 -';
        const result = cleanPdfText(input);
        expect(result).not.toContain('- 12 -');
        expect(result).toContain('Isi pasal');
    });

    it('handles empty string', () => {
        expect(cleanPdfText('')).toBe('');
    });

    it('removes PRESIDEN REPUBLIK INDONESIA', () => {
        const input = 'PRESIDEN REPUBLIK INDONESIA\nIsi pasal';
        const result = cleanPdfText(input);
        expect(result).not.toContain('PRESIDEN');
        expect(result).toContain('Isi pasal');
    });

    it('normalizes multiple newlines', () => {
        const input = 'Paragraf 1\n\n\n\n\nParagraf 2';
        const result = cleanPdfText(input);
        // After cleaning, should have at most double newlines
        expect(result).not.toContain('\n\n\n');
    });
});

describe('cleanMarkdownText', () => {
    it('removes page numbers', () => {
        const input = '- 12 -\nIsi pasal\n- 13 -';
        const result = cleanMarkdownText(input);
        expect(result).not.toContain('- 12 -');
        expect(result).toContain('Isi pasal');
    });

    it('handles empty string', () => {
        expect(cleanMarkdownText('')).toBe('');
    });

    it('removes PRESIDEN REPUBLIK INDONESIA', () => {
        const input = 'PRESIDEN REPUBLIK INDONESIA\nIsi pasal';
        const result = cleanMarkdownText(input);
        expect(result).not.toContain('PRESIDEN');
        expect(result).toContain('Isi pasal');
    });

    it('normalizes multiple newlines', () => {
        const input = 'Paragraf 1\n\n\n\n\nParagraf 2';
        const result = cleanMarkdownText(input);
        expect(result).not.toContain('\n\n\n');
    });

    it('retains solitary numbers (unlike cleanPdfText)', () => {
        const input = '1\nIsi pasal\n2';
        const resultPdf = cleanPdfText(input);
        const resultMd = cleanMarkdownText(input);

        // cleanPdfText removes solitary numbers:
        expect(resultPdf).not.toContain('1');
        expect(resultPdf).not.toContain('2');

        // cleanMarkdownText retains solitary numbers:
        expect(resultMd).toContain('1');
        expect(resultMd).toContain('2');
    });
});
