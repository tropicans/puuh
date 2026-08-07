import { describe, it, expect } from 'vitest';
import {
  inferOutcomeFromAmar,
  inferDispositionFromExcerpt,
  extractArticleNumbersFromText,
  buildImpactsFromAmar
} from './judicial-review';

describe('Judicial Review Helpers', () => {
  describe('inferOutcomeFromAmar', () => {
    it('should infer GRANTED outcome correctly', () => {
      const text = 'Mengabulkan permohonan pemohon untuk seluruhnya.';
      expect(inferOutcomeFromAmar(text)).toBe('GRANTED');
    });

    it('should infer PARTIALLY_GRANTED outcome correctly', () => {
      const text = 'Mengabulkan permohonan pemohon untuk sebagian.';
      expect(inferOutcomeFromAmar(text)).toBe('PARTIALLY_GRANTED');
    });

    it('should infer REJECTED outcome correctly', () => {
      const text = 'Menolak permohonan pemohon untuk seluruhnya.';
      expect(inferOutcomeFromAmar(text)).toBe('REJECTED');
    });

    it('should infer INADMISSIBLE outcome correctly', () => {
      const text = 'Menyatakan permohonan pemohon tidak dapat diterima.';
      expect(inferOutcomeFromAmar(text)).toBe('INADMISSIBLE');
    });

    it('should return OTHER for unspecified outcomes', () => {
      const text = 'Menetapkan hari sidang berikutnya.';
      expect(inferOutcomeFromAmar(text)).toBe('OTHER');
    });
  });

  describe('inferDispositionFromExcerpt', () => {
    it('should infer INVALIDATED when text matches invalid symbols', () => {
      expect(inferDispositionFromExcerpt('dinyatakan tidak mempunyai kekuatan hukum mengikat', 'GRANTED')).toBe('INVALIDATED');
      expect(inferDispositionFromExcerpt('menyatakan batal demi hukum', 'PARTIALLY_GRANTED')).toBe('INVALIDATED');
    });

    it('should infer CONDITIONALLY_VALID when text matches', () => {
      expect(inferDispositionFromExcerpt('konstitusional bersyarat sepanjang diartikan...', 'PARTIALLY_GRANTED')).toBe('CONDITIONALLY_VALID');
    });

    it('should infer CONDITIONALLY_INVALID when text matches', () => {
      expect(inferDispositionFromExcerpt('inkonstitusional bersyarat sepanjang tidak diartikan...', 'PARTIALLY_GRANTED')).toBe('CONDITIONALLY_INVALID');
    });

    it('should infer UPHELD when case is rejected or inadmissible', () => {
      expect(inferDispositionFromExcerpt('menolak permohonan pengujian pasal 1', 'REJECTED')).toBe('UPHELD');
      expect(inferDispositionFromExcerpt('permohonan tidak dapat diterima', 'INADMISSIBLE')).toBe('UPHELD');
    });
  });

  describe('extractArticleNumbersFromText', () => {
    it('should extract articles including paragraphs/ayat', () => {
      const text = 'Menyatakan Pasal 1 ayat (1) dan Pasal 2 ayat (2) bertentangan dengan UUD.';
      const extracted = extractArticleNumbersFromText(text);
      expect(extracted).toContain('Pasal 1 ayat (1)');
      expect(extracted).toContain('Pasal 2 ayat (2)');
    });

    it('should deduplicate matches', () => {
      const text = 'Pasal 5 ayat (1) dan juga Pasal 5 ayat (1).';
      const extracted = extractArticleNumbersFromText(text);
      expect(extracted).toHaveLength(1);
      expect(extracted[0]).toBe('Pasal 5 ayat (1)');
    });
  });

  describe('buildImpactsFromAmar', () => {
    it('should build impacts array correctly', () => {
      const text = 'Menyatakan Pasal 3 ayat (2) bertentangan dengan UUD.';
      const impacts = buildImpactsFromAmar(text, 'GRANTED');
      expect(impacts).toHaveLength(1);
      expect(impacts[0].articleNumber).toBe('Pasal 3 ayat (2)');
      expect(impacts[0].disposition).toBe('INVALIDATED');
    });
  });
});
