import './polyfills';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanPdfText } from './utils';
import { pathToFileURL } from 'url';
import path from 'path';

type PdfDocument = Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;

// Configure worker for Node.js
if (typeof window === 'undefined') {
    const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
}

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
        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(pdfBuffer);

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useSystemFonts: true,
            disableFontFace: true,
        });

        // Timeout wrapper for pdf loading
        const timeoutPromise = new Promise<PdfDocument>((_, reject) => {
            setTimeout(() => reject(new Error('PDFJS_TIMEOUT')), 30000);
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
                    .map((item) => ('str' in item ? item.str : ''))
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
 * Try multiple methods to extract text from PDF
 */
export async function smartExtractPdfText(
    pdfBuffer: Buffer,
    onProgress?: (msg: string) => void
): Promise<{
    text: string;
    method: 'pdfjs' | 'pdf-parse' | 'ocr';
    numPages?: number;
}> {
    // Method 1: Try pdfjs-dist first
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

    // Method 2: Try pdf-parse
    try {
        if (onProgress) onProgress('Metode 1 gagal/timeout, mencoba metode alternatif...');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        let text = '';
        let numPages = 0;
        if (typeof pdfParse === 'function') {
            const data = await pdfParse(pdfBuffer);
            text = data.text || '';
            numPages = data.numpages || 0;
        } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
            const parser = new pdfParse.PDFParse({ data: new Uint8Array(pdfBuffer) });
            const result = await parser.getText();
            text = result.text || '';
            numPages = result.total || result.pages?.length || 0;
        } else {
            throw new Error('Unsupported pdf-parse module format');
        }

        if (text && text.length > 200) {
            return {
                text: cleanPdfText(text),
                method: 'pdf-parse',
                numPages: numPages
            };
        }
        console.log('pdf-parse also got little text');
    } catch (e) {
        console.error('pdf-parse failed:', e);
    }

    // Method 3: Vision OCR (imported dynamically to avoid circular deps)
    console.log('Trying Vision OCR for scanned PDF...');
    if (onProgress) onProgress('PDF terdeteksi sebagai scan/gambar. Beralih ke Vision OCR (ini mungkin memakan waktu)...');

    const { extractTextWithVision } = await import('./ocr-service');
    // Verified: onProgress callback is correctly forwarded to handle resilient fallbacks and track status.
    const ocrText = await extractTextWithVision(pdfBuffer, onProgress);

    return {
        text: cleanPdfText(ocrText),
        method: 'ocr'
    };
}
