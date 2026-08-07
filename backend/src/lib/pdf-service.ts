import { cleanPdfText, cleanMarkdownText } from '../utils/text';
import config from '../config/index';

/** Lazy-loaded pdfjs module to avoid top-level async imports */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs has no complete type defs for dynamic import
let pdfjsLib: Record<string, unknown> | null = null;

async function initPdfJs(): Promise<Record<string, unknown>> {
    if (!pdfjsLib) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs dynamic import
        pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs') as unknown as Record<string, unknown>;
        if (typeof window === 'undefined') {
            // @ts-ignore -- workerPort is not in pdfjs type defs
            const workerPort = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
            (pdfjsLib.GlobalWorkerOptions as Record<string, unknown>).workerPort = workerPort;
        }
    }
    return pdfjsLib;
}

interface PdfjsTextItem {
    str?: string;
    [key: string]: unknown;
}

interface PdfjsTextContent {
    items: PdfjsTextItem[];
}

interface PdfjsPage {
    getTextContent(): Promise<PdfjsTextContent>;
}

interface PdfjsDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfjsPage>;
}

/**
 * OCR mode for PDF extraction:
 * - AUTO: full pipeline (Docling → pdfjs → pdf-parse → Vision OCR)
 * - FORCE: skip to Vision OCR immediately
 * - SKIP: never use Vision OCR; fail gracefully if text is too short
 */
export type OcrMode = 'AUTO' | 'FORCE' | 'SKIP';

/**
 * Extract text from PDF using pdfjs-dist
 * Works better than pdf-parse for some PDFs
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{
    text: string;
    numPages: number;
    isScanned: boolean;
}> {
    try {
        const pdfjs = await initPdfJs();
        const getDocument = pdfjs.getDocument as (opts: Record<string, unknown>) => { promise: Promise<PdfjsDocument> };
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);

        // Load PDF document
        const loadingTask = getDocument({
            data: uint8Array,
            useSystemFonts: true,
            disableFontFace: true,
        });

        // Timeout wrapper for pdf loading
        const timeoutPromise = new Promise<PdfjsDocument>((_, reject) => {
            setTimeout(() => reject(new Error('PDFJS_TIMEOUT')), 5000);
        });

        // Race between loading and timeout
        const pdf = await Promise.race([
            loadingTask.promise,
            timeoutPromise
        ]);
        const numPages = pdf.numPages;

        console.log(`PDF loaded: ${numPages} pages`);

        let fullText = '';
        let totalChars = 0;

        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Combine text items
                const pageText = textContent.items
                    .map((item) => (typeof item.str === 'string' ? item.str : ''))
                    .join(' ');

                fullText += pageText + '\n\n';
                totalChars += pageText.length;
            } catch (pageError) {
                console.error(`Error extracting page ${i}:`, pageError);
            }
        }

        console.log(`PDF text extracted: ${totalChars} chars from ${numPages} pages`);

        // If very little text, probably scanned
        const isScanned = totalChars < 100 * numPages; // Less than 100 chars per page average

        return {
            text: fullText.trim(),
            numPages,
            isScanned
        };
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw error;
    }
}

/**
 * Try multiple methods to extract text from PDF.
 * Behaviour is controlled by `ocrMode`:
 * - AUTO (default): Docling → pdfjs → pdf-parse → Vision OCR
 * - FORCE: skip straight to Vision OCR
 * - SKIP: Docling → pdfjs → pdf-parse only (no Vision OCR)
 */
export async function smartExtractPdfText(
    pdfBuffer: Buffer,
    onProgress?: (msg: string) => void,
    ocrMode: OcrMode = 'AUTO'
): Promise<{
    text: string;
    method: 'pdfjs' | 'pdf-parse' | 'ocr' | 'docling';
    numPages?: number;
}> {
    // FORCE mode — skip directly to Vision OCR
    if (ocrMode === 'FORCE') {
        console.log('OCR mode FORCE: skipping to Vision OCR directly');
        if (onProgress) onProgress('Mode FORCE: langsung menggunakan Vision OCR...');
        const { extractTextWithVision } = await import('./ocr-service.js');
        const ocrText = await extractTextWithVision(pdfBuffer, onProgress);
        return {
            text: cleanPdfText(ocrText),
            method: 'ocr'
        };
    }

    // Method 1: Try Docling API first
    try {
        if (onProgress) onProgress('Mencoba membaca teks menggunakan Docling...');

        const baseUrl = process.env.DOCLING_API_URL || config.DOCLING_API_URL;
        const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/convert/file`;

        const formData = new FormData();
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        formData.append('files', blob, 'document.pdf');
        formData.append('options', JSON.stringify({ to_formats: ['md'] }));

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(15000), // D-01: 15s timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Docling API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json() as {
            status: string;
            document?: {
                md_content?: string;
            };
        };

        if (data.status === 'success' && data.document?.md_content) {
            const mdText = data.document.md_content;
            if (onProgress) {
                onProgress(`Teks berhasil diekstrak (docling): ${mdText.length} karakter`);
            }
            return {
                text: cleanMarkdownText(mdText),
                method: 'docling'
            };
        } else {
            throw new Error(`Docling conversion status: ${data.status}`);
        }
    } catch (e) {
        console.error('Docling extraction failed, initiating fallback:', e);

        if (onProgress) {
            onProgress('Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...');
        }
    }

    // Method 2: Try pdfjs-dist
    try {
        if (onProgress) onProgress('Mencoba membaca teks digital...');
        const result = await extractTextFromPdf(pdfBuffer);
        if (result.text.length > 200 && !result.isScanned) {
            return {
                text: cleanPdfText(result.text),
                method: 'pdfjs',
                numPages: result.numPages
            };
        }
        console.log('pdfjs got little text, trying pdf-parse...');
    } catch (e) {
        console.error('pdfjs failed:', e);
    }

    // Method 3: Try pdf-parse
    try {
        if (onProgress) onProgress('Metode 1 gagal/timeout, mencoba metode alternatif...');
        const pdfParseModule = await import('pdf-parse');
        
        let text = '';
        let numPages = 0;
        
        if (typeof (pdfParseModule as unknown as { PDFParse?: unknown }).PDFParse === 'function') {
            const PDFParse = (pdfParseModule as unknown as { PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string; pages?: unknown[] }> } }).PDFParse;
            const parser = new PDFParse({ data: pdfBuffer });
            const result = await parser.getText();
            text = result.text;
            numPages = result.pages?.length ?? 0;
        } else {
            const mod = pdfParseModule as unknown as { default?: unknown };
            const pdfParseFn = (mod.default || mod) as (
                buf: Buffer
            ) => Promise<{ text: string; numpages?: number }>;
            const data = await pdfParseFn(pdfBuffer);
            text = data.text;
            numPages = data.numpages ?? 0;
        }

        if (text && text.length > 200) {
            return {
                text: cleanPdfText(text),
                method: 'pdf-parse',
                numPages
            };
        }
        console.log('pdf-parse also got little text');
    } catch (e) {
        console.error('pdf-parse failed:', e);
    }

    // SKIP mode — do NOT fall through to Vision OCR
    if (ocrMode === 'SKIP') {
        throw new Error('Mode SKIP: semua metode digital gagal/teks terlalu pendek. Vision OCR dinonaktifkan untuk dokumen ini.');
    }

    // Method 4: Vision OCR (AUTO mode only; imported dynamically to avoid circular deps)
    console.log('Trying Vision OCR for scanned PDF...');
    if (onProgress) onProgress('PDF terdeteksi sebagai scan/gambar. Beralih ke Vision OCR (ini mungkin memakan waktu)...');

    const { extractTextWithVision } = await import('./ocr-service.js');
    const ocrText = await extractTextWithVision(pdfBuffer, onProgress);

    return {
        text: cleanPdfText(ocrText),
        method: 'ocr'
    };
}
