/**
 * PDF Cache Service — MD5-based deduplication of PDF extraction results.
 * Computes MD5 hash of PDF buffer and checks for an existing RegulationVersion
 * with the same hash to avoid redundant Docling/OCR processing.
 */
import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Compute an MD5 hex digest of a PDF buffer.
 */
export function computeMd5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Cached version fields returned when a PDF hash match is found.
 */
export interface CachedVersionResult {
  id: string;
  regulationId: string;
  rawText: string | null;
  extractionMethod: string | null;
  fullTitle: string;
}

/**
 * Look up a previously processed version by PDF MD5 hash.
 * Returns `null` if no matching version is found.
 */
export async function findCachedVersion(md5Hash: string): Promise<CachedVersionResult | null> {
  return prisma.regulationVersion.findFirst({
    where: { pdfMd5Hash: md5Hash },
    select: {
      id: true,
      regulationId: true,
      rawText: true,
      extractionMethod: true,
      fullTitle: true,
    },
  });
}
