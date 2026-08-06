import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { smartExtractPdfText } from './pdf-service';

const { mockGetDocument, mockPdfParse, mockExtractTextWithVision } = vi.hoisted(() => {
    return {
        mockGetDocument: vi.fn(),
        mockPdfParse: vi.fn(),
        mockExtractTextWithVision: vi.fn()
    };
});

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => {
    return {
        getDocument: mockGetDocument,
        GlobalWorkerOptions: {
            workerPort: null
        }
    };
});

vi.mock('pdf-parse', () => {
    return {
        default: mockPdfParse,
        PDFParse: undefined
    };
});

vi.mock('./ocr-service', () => {
    return {
        extractTextWithVision: mockExtractTextWithVision
    };
});

describe('smartExtractPdfText with Docling integration', () => {
    const mockPdfBuffer = Buffer.from('dummy pdf content');
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.DOCLING_API_URL = 'http://docling-serve:5001';
        fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it('should successfully extract text using Docling and return method docling', async () => {
        const mockMdContent = '# Peraturan Uji\n\nPasal 1\n\nContent of article 1.';
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'success',
                document: {
                    md_content: mockMdContent
                }
            })
        });

        const progressMessages: string[] = [];
        const onProgress = (msg: string) => {
            progressMessages.push(msg);
        };

        const result = await smartExtractPdfText(mockPdfBuffer, onProgress);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://docling-serve:5001/v1/convert/file');
        expect(options.method).toBe('POST');
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.signal).toBeInstanceOf(AbortSignal);

        expect(result.text).toContain('Peraturan Uji');
        expect(result.method).toBe('docling');

        expect(progressMessages).toContain('Mencoba membaca teks menggunakan Docling...');
        expect(progressMessages.some(m => m.includes('Teks berhasil diekstrak (docling)'))).toBe(true);
    });

    it('should fallback to pdfjs when Docling API fails with HTTP error', async () => {
        // Docling returns 500 Internal Server Error
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error'
        });

        // Mock pdfjs success (returns more than 200 chars to avoid falling back further)
        const longText = 'A'.repeat(250);
        const mockPage = {
            getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: longText }]
            })
        };
        const mockPdf = {
            numPages: 1,
            getPage: vi.fn().mockResolvedValue(mockPage)
        };
        vi.mocked(mockGetDocument).mockReturnValue({
            promise: Promise.resolve(mockPdf)
        } as unknown as ReturnType<typeof mockGetDocument>);

        const progressMessages: string[] = [];
        const onProgress = (msg: string) => {
            progressMessages.push(msg);
        };

        const result = await smartExtractPdfText(mockPdfBuffer, onProgress);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.text).toBe(longText);
        expect(result.method).toBe('pdfjs');

        expect(progressMessages).toContain('Mencoba membaca teks menggunakan Docling...');
        expect(progressMessages).toContain('Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...');
        expect(progressMessages).toContain('Mencoba membaca teks digital...');
    });

    it('should fallback to pdfjs and then to pdf-parse when pdfjs returns too little text', async () => {
        // Docling returns 400 Bad Request
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => 'Bad Request'
        });

        // Mock pdfjs returning too little text (e.g. 50 characters)
        const shortText = 'A'.repeat(50);
        const mockPage = {
            getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: shortText }]
            })
        };
        const mockPdf = {
            numPages: 1,
            getPage: vi.fn().mockResolvedValue(mockPage)
        };
        vi.mocked(mockGetDocument).mockReturnValue({
            promise: Promise.resolve(mockPdf)
        } as unknown as ReturnType<typeof mockGetDocument>);

        // Mock pdf-parse success with long text
        const longText = 'B'.repeat(300);
        vi.mocked(mockPdfParse).mockResolvedValueOnce({
            text: longText,
            numpages: 1
        });

        const progressMessages: string[] = [];
        const onProgress = (msg: string) => {
            progressMessages.push(msg);
        };

        const result = await smartExtractPdfText(mockPdfBuffer, onProgress);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.text).toBe(longText);
        expect(result.method).toBe('pdf-parse');

        expect(progressMessages).toContain('Mencoba membaca teks menggunakan Docling...');
        expect(progressMessages).toContain('Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...');
        expect(progressMessages).toContain('Mencoba membaca teks digital...');
        expect(progressMessages).toContain('Metode 1 gagal/timeout, mencoba metode alternatif...');
    });

    it('should fallback to ocr-service when both Docling and digital extractors fail', async () => {
        // Docling fails with network/fetch error
        fetchSpy.mockRejectedValueOnce(new Error('Network error'));

        // Mock pdfjs failure
        vi.mocked(mockGetDocument).mockImplementation(() => {
            throw new Error('PDFJS Load failed');
        });

        // Mock pdf-parse failure
        vi.mocked(mockPdfParse).mockRejectedValueOnce(new Error('pdf-parse failed'));

        // Mock vision OCR success
        const ocrText = 'C'.repeat(500);
        vi.mocked(mockExtractTextWithVision).mockResolvedValueOnce(ocrText);

        const progressMessages: string[] = [];
        const onProgress = (msg: string) => {
            progressMessages.push(msg);
        };

        const result = await smartExtractPdfText(mockPdfBuffer, onProgress);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.text).toBe(ocrText);
        expect(result.method).toBe('ocr');

        expect(progressMessages).toContain('Mencoba membaca teks menggunakan Docling...');
        expect(progressMessages).toContain('Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...');
        expect(progressMessages).toContain('PDF terdeteksi sebagai scan/gambar. Beralih ke Vision OCR (ini mungkin memakan waktu)...');
    });

    it('should respect 15-second timeout on Docling API fetch', async () => {
        // Mock fetch timing out
        fetchSpy.mockImplementationOnce(() => {
            return new Promise((_, reject) => {
                const err = new Error('The operation was aborted.');
                err.name = 'AbortError';
                reject(err);
            });
        });

        // Mock pdfjs success
        const longText = 'A'.repeat(250);
        const mockPage = {
            getTextContent: vi.fn().mockResolvedValue({
                items: [{ str: longText }]
            })
        };
        const mockPdf = {
            numPages: 1,
            getPage: vi.fn().mockResolvedValue(mockPage)
        };
        vi.mocked(mockGetDocument).mockReturnValue({
            promise: Promise.resolve(mockPdf)
        } as unknown as ReturnType<typeof mockGetDocument>);

        const progressMessages: string[] = [];
        const onProgress = (msg: string) => {
            progressMessages.push(msg);
        };

        const result = await smartExtractPdfText(mockPdfBuffer, onProgress);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(result.text).toBe(longText);
        expect(result.method).toBe('pdfjs');
        expect(progressMessages).toContain('Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...');
    });
});
