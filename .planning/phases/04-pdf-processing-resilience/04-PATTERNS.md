# Phase 4: PDF Processing Resilience - Pattern Map

This document identifies the file roles, data flows, and code patterns for the implementation of Phase 4: PDF Processing Resilience.

## File Classifications & Analogs

| Target File | Classification (Role) | Data Flow Pattern | Closest Code Analog |
| :--- | :--- | :--- | :--- |
| `src/lib/ocr-service.ts` | **Service** | Request-response, File I/O, Error recovery, Event callbacks | `src/lib/ocr-service.ts` (itself) |
| `src/lib/pdf-service.ts` | **Service** | Orchestrator, Fallback routing | `src/lib/pdf-service.ts` (itself) |
| `src/lib/ocr-service.test.ts` | **Test** | API mock, Error state assertion | `src/lib/diff-engine.test.ts` |

---

## 1. `src/lib/ocr-service.ts` (Modified)
### Key Responsibilities
- Catch document-level load/split failures from `pdf-lib` and fallback to processing the entire PDF buffer as a single request.
- Catch chunk-level processing failures and fallback to single-page processing only for pages within the failed chunk.
- Manage rate limits by running single-page processing with low concurrency (1 or 2 concurrent requests).
- Retry single-page failures up to 2 times (3 total attempts) with exponential backoff (2 seconds, then 4 seconds).
- Stream progress messages to the UI.

### Imports & Key Patterns to Copy

#### Dynamic Import & Document Level Fallback
```typescript
import { cleanPdfText } from './utils';

// Dynamic import of pdf-lib to load and count pages, with full fallback
let pdfDoc;
try {
    const { PDFDocument } = await import('pdf-lib');
    pdfDoc = await PDFDocument.load(pdfBuffer);
} catch (loadError) {
    console.error('Failed to load PDF via pdf-lib:', loadError);
    if (onProgress) {
        onProgress('Mendeteksi kendala pemuatan PDF, mencoba memproses seluruh berkas sekaligus...');
    }
    try {
        return await extractChunkWithVision(pdfBuffer, 0);
    } catch (fallbackError) {
        console.error('Whole-document OCR fallback failed:', fallbackError);
        throw fallbackError;
    }
}
```

#### Chunk Execution with Targeted Single-Page Fallback
```typescript
const tasks = chunks.map(chunk => async () => {
    const currentChunk = chunk.index + 1;
    let retries = 0;
    let success = false;
    let chunkText = '';

    while (!success && retries < 2) {
        try {
            if (onProgress) onProgress('Memproses Chunk OCR ' + currentChunk + ' dari ' + totalChunks + '...');
            chunkText = await extractChunkWithVision(chunk.buffer, chunk.index);
            success = true;
        } catch (e) {
            console.error('Chunk error (retry ' + retries + '):', e);
            retries++;
            if (retries < 2) {
                if (onProgress) onProgress('Chunk ' + currentChunk + ' gagal, mencoba kembali dalam 2s...');
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    // Target fallback to single-page processing only for pages inside this failed chunk
    if (!success) {
        if (onProgress) {
            onProgress('Mendeteksi kendala pada chunk ' + currentChunk + ', memproses per halaman...');
        }

        const startPage = chunk.index * PAGES_PER_CHUNK;
        const endPage = Math.min((chunk.index + 1) * PAGES_PER_CHUNK, pageCount);
        const pageTexts: string[] = [];

        // Create tasks for each single page in the failed chunk
        const singlePageTasks = Array.from({ length: endPage - startPage }, (_, k) => {
            const pageIndex = startPage + k;
            return async () => {
                const subPdf = await PDFDocument.create();
                const [copiedPage] = await subPdf.copyPages(pdfDoc, [pageIndex]);
                subPdf.addPage(copiedPage);
                const pageBytes = await subPdf.save();
                const pageBuffer = Buffer.from(pageBytes);

                let pageRetries = 0;
                let pageSuccess = false;
                let pageText = '';
                const maxPageRetries = 2;
                const backoffMs = [2000, 4000];

                while (!pageSuccess && pageRetries <= maxPageRetries) {
                    try {
                        pageText = await extractChunkWithVision(pageBuffer, pageIndex);
                        pageSuccess = true;
                    } catch (pageError) {
                        console.error('Page ' + (pageIndex + 1) + ' error (retry ' + pageRetries + '):', pageError);
                        pageRetries++;
                        if (pageRetries <= maxPageRetries) {
                            const delay = backoffMs[pageRetries - 1];
                            if (onProgress) {
                                onProgress('Halaman ' + (pageIndex + 1) + ' gagal, mencoba kembali dalam ' + (delay / 1000) + 's...');
                            }
                            await new Promise(r => setTimeout(r, delay));
                        } else {
                            throw new Error('Failed to extract text from page ' + (pageIndex + 1) + ' after retries.');
                        }
                    }
                }
                return pageText;
            };
        });

        // Run single page tasks with low concurrency (limit 1-2)
        const CONCURRENCY_LIMIT_SINGLE_PAGE = 2;
        const singlePageResults = await runWithConcurrencyLimit(singlePageTasks, CONCURRENCY_LIMIT_SINGLE_PAGE);
        chunkText = singlePageResults.join('\n\n');
    }

    return chunkText;
});
```

---

## 2. `src/lib/pdf-service.ts` (Modified/Verified)
### Key Responsibilities
- Ensure that the entrypoint `smartExtractPdfText` propagates `onProgress` correctly and is robust to dynamic import of OCR services.

### Code Pattern (Already Established)
```typescript
// Dynamic import of OCR service to resolve circular dependency
const { extractTextWithVision } = await import('./ocr-service');
const ocrText = await extractTextWithVision(pdfBuffer, onProgress);
```

---

## 3. `src/lib/ocr-service.test.ts` (Created)
### Key Responsibilities
- Unit test coverage of retry mechanisms, concurrency pooling, chunk fallback, and document-level fallback inside the OCR service.

### Code Pattern to Copy (from `diff-engine.test.ts`)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextWithVision } from '@/lib/ocr-service';

// Mocking external endpoints and libraries
vi.mock('pdf-lib', () => {
    return {
        PDFDocument: {
            load: vi.fn(),
            create: vi.fn(),
        }
    };
});

describe('OCR Service Resilience', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully recover using single page processing if a chunk fails', async () => {
        // Test setup & assertions here...
    });
});
```
