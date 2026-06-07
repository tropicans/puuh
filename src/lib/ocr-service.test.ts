import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { extractTextWithVision, runWithConcurrencyLimit } from './ocr-service';
import type { PDFDocument } from 'pdf-lib';

// Mock pdf-lib
vi.mock('pdf-lib', () => {
    const mockPDFDoc = {
        getPageCount: vi.fn(),
        copyPages: vi.fn(),
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };
    const mockPDFDocumentClass = {
        load: vi.fn().mockResolvedValue(mockPDFDoc),
        create: vi.fn().mockResolvedValue(mockPDFDoc),
    };
    return {
        PDFDocument: mockPDFDocumentClass,
    };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OCR Service - Concurrency Helper', () => {
    it('runWithConcurrencyLimit respects the concurrency limit', async () => {
        let active = 0;
        let maxActive = 0;
        const tasks = Array.from({ length: 10 }, (_, i) => async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise(r => setTimeout(r, 10));
            active--;
            return i;
        });
        const results = await runWithConcurrencyLimit(tasks, 3);
        expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(maxActive).toBeLessThanOrEqual(3);
    });
});

describe('OCR Service - Vision Text Extraction Resilience', () => {
    let timeoutSpy: MockInstance;
    const largeBuffer = Buffer.alloc(1024 * 1024 + 10); // 1.1 MB to force splitting

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup a mock implementation of setTimeout to bypass delays during tests
        timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn: unknown) => {
            if (typeof fn === 'function') fn();
            return 0 as unknown as NodeJS.Timeout;
        }) as unknown as MockInstance;
    });

    afterEach(() => {
        timeoutSpy.mockRestore();
    });

    it('processes small files directly', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Direct Text' } }]
            })
        });

        const result = await extractTextWithVision(Buffer.from('small doc'));
        expect(result).toBe('Direct Text');
    });

    it('splits large files and processes chunk successfully', async () => {
        const { PDFDocument } = await import('pdf-lib');
        const mockPDFDoc = {
            getPageCount: vi.fn().mockReturnValue(5),
            copyPages: vi.fn().mockResolvedValue([{}]),
            addPage: vi.fn(),
            save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        };
        vi.mocked(PDFDocument.load).mockResolvedValue(mockPDFDoc as unknown as PDFDocument);
        vi.mocked(PDFDocument.create).mockReturnValue(mockPDFDoc as unknown as PDFDocument);

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Chunk Text' } }]
            })
        });

        const progressMessages: string[] = [];
        const result = await extractTextWithVision(largeBuffer, (msg) => {
            progressMessages.push(msg);
        });

        expect(result).toBe('Chunk Text');
        expect(progressMessages).toContain('Memproses Chunk OCR 1 dari 1...');
    });

    it('falls back to whole document OCR if pdf-lib load throws error', async () => {
        const { PDFDocument } = await import('pdf-lib');
        vi.mocked(PDFDocument.load).mockRejectedValueOnce(new Error('Corrupted PDF file'));

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Whole PDF Text Recovery' } }]
            })
        });

        const progressMessages: string[] = [];
        const result = await extractTextWithVision(largeBuffer, (msg) => {
            progressMessages.push(msg);
        });

        expect(result).toBe('Whole PDF Text Recovery');
        expect(progressMessages).toContain('Mendeteksi kendala pemecahan dokumen, beralih ke OCR seluruh dokumen...');
    });

    it('falls back to single-page processing when chunk processing fails after retries', async () => {
        const { PDFDocument } = await import('pdf-lib');
        const mockPDFDoc = {
            getPageCount: vi.fn().mockReturnValue(2),
            copyPages: vi.fn().mockResolvedValue([{}]),
            addPage: vi.fn(),
            save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        };
        vi.mocked(PDFDocument.load).mockResolvedValue(mockPDFDoc as unknown as PDFDocument);
        vi.mocked(PDFDocument.create).mockReturnValue(mockPDFDoc as unknown as PDFDocument);

        let callCount = 0;
        mockFetch.mockImplementation(async () => {
            const currentCall = ++callCount;
            if (currentCall <= 2) {
                // Chunk attempt 1 & 2 fail
                return {
                    ok: false,
                    status: 500,
                    text: async () => 'Internal Server Error'
                };
            }
            // Page 1 & 2 succeed
            return {
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: `Page ${currentCall - 2} Text` } }]
                })
            };
        });

        const progressMessages: string[] = [];
        const result = await extractTextWithVision(largeBuffer, (msg) => {
            progressMessages.push(msg);
        });

        expect(result).toContain('Page 1 Text');
        expect(result).toContain('Page 2 Text');
        expect(progressMessages).toContain('Mendeteksi kendala, beralih ke OCR per halaman untuk Chunk 1...');
    });

    it('retries single-page failures up to 2 times with exponential backoff (2s, then 4s)', async () => {
        const { PDFDocument } = await import('pdf-lib');
        const mockPDFDoc = {
            getPageCount: vi.fn().mockReturnValue(1),
            copyPages: vi.fn().mockResolvedValue([{}]),
            addPage: vi.fn(),
            save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        };
        vi.mocked(PDFDocument.load).mockResolvedValue(mockPDFDoc as unknown as PDFDocument);
        vi.mocked(PDFDocument.create).mockReturnValue(mockPDFDoc as unknown as PDFDocument);

        let callCount = 0;
        mockFetch.mockImplementation(async () => {
            const currentCall = ++callCount;
            if (currentCall <= 2) {
                // Chunk attempts fail
                return {
                    ok: false,
                    status: 500,
                    text: async () => 'Chunk failed'
                };
            }
            // Page attempt 1 (currentCall = 3) -> fails
            // Page attempt 2 (currentCall = 4) -> fails
            // Page attempt 3 (currentCall = 5) -> succeeds
            if (currentCall === 3 || currentCall === 4) {
                return {
                    ok: false,
                    status: 500,
                    text: async () => 'Page transient error'
                };
            }
            return {
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Page Recovered Content' } }]
                })
            };
        });

        const result = await extractTextWithVision(largeBuffer);
        expect(result).toBe('Page Recovered Content');

        // Verify exponential backoff delays (2000ms then 4000ms)
        const delays = timeoutSpy.mock.calls.map((call: unknown[]) => call[1] as number);
        expect(delays).toContain(2000);
        expect(delays).toContain(4000);
    });
});
