/**
 * OCR Service using LLM Vision Models
 * Uses proxy.kelazz.my.id vision-capable models for OCR
 */

import type { PDFDocument } from 'pdf-lib';

const LLM_BASE_URL = process.env.OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1';
const LLM_API_KEY = process.env.OPENAI_API_KEY || '';
const VISION_MODEL = process.env.VISION_MODEL || 'commandcode/google/gemini-3.5-flash'; // Vision-capable model

/**
 * Perform OCR on an image using LLM Vision
 */
export async function performOCR(imageBuffer: Buffer): Promise<string> {
    const base64Image = imageBuffer.toString('base64');

    // Detect image type
    const imageType = detectImageType(imageBuffer);
    const dataUrl = `data:${imageType};base64,${base64Image}`;

    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${LLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Ekstrak SEMUA teks dari gambar ini. Output hanya teks yang terbaca, tanpa komentar atau penjelasan. Jaga format asli termasuk baris baru dan indentasi.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: dataUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4000,
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Detect image type from buffer
 */
function detectImageType(buffer: Buffer): string {
    // Check magic bytes
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
    if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
    if (buffer[0] === 0x25 && buffer[1] === 0x50) return 'application/pdf';
    return 'image/png'; // Default
}

/**
 * Extract text from small PDF chunk using Vision OCR
 */
async function extractChunkWithVision(pdfBuffer: Buffer, chunkIndex: number): Promise<string> {
    console.log(`Processing Chunk ${chunkIndex + 1} (${(pdfBuffer.length / 1024).toFixed(1)} KB)...`);

    try {
        const base64Pdf = pdfBuffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

        const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LLM_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extract ALL text from this PDF document. Output only the full text content found.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: dataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 8000,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetail = errorText;
            try {
                const parsed = JSON.parse(errorText);
                errorDetail = parsed.error?.message || errorText;
            } catch {
                // Not JSON
            }
            if (response.status === 413 || errorDetail.includes('too large')) {
                throw new Error('CHUNK_TOO_LARGE');
            }
            throw new Error(`Vision API error: ${response.status} - ${errorDetail}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log(`Chunk ${chunkIndex + 1} Result: ${text.length} chars`);
        return text;
    } catch (error) {
        throw error;
    }
}

/**
 * Test Vision API connection
 */
export async function testVisionAPI(): Promise<{ success: boolean; message: string }> {
    try {
        // Create a simple test - just check if model is available
        const response = await fetch(`${LLM_BASE_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${LLM_API_KEY}`,
            },
        });

        if (!response.ok) {
            return { success: false, message: `API Error: ${response.status}` };
        }

        const data = await response.json();
        const models = data.data || [];
        const hasVisionModel = models.some((m: { id: string }) =>
            m.id.includes('gemini') || m.id.includes('vision') || m.id.includes('gpt-4')
        );

        if (hasVisionModel) {
            return {
                success: true,
                message: `Vision ready (using ${VISION_MODEL})`
            };
        }

        return {
            success: false,
            message: 'No vision-capable model found'
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed'
        };
    }
}

/**
 * Extract text from PDF using smart splitting
 * Splits PDF into smaller chunks if > 1MB or > 5 pages
 */
export async function extractTextWithVision(pdfBuffer: Buffer, onProgress?: (msg: string) => void): Promise<string> {
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);

    // If small enough (< 1MB), try direct
    if (fileSizeMB < 1) {
        console.log(`PDF is small (${fileSizeMB.toFixed(2)} MB), trying direct OCR...`);
        if (onProgress) onProgress('File kecil, mencoba OCR langsung...');
        try {
            return await extractChunkWithVision(pdfBuffer, 0);
        } catch (e) {
            console.log('Direct OCR failed, falling back to splitting...', e);
        }
    }

    console.log(`PDF is large (${fileSizeMB.toFixed(2)} MB), splitting...`);
    if (onProgress) onProgress('File besar, memecah PDF agar aman...');

    let PDFDocumentClass: typeof PDFDocument;
    let pdfDoc: PDFDocument | undefined = undefined;

    try {
        const { PDFDocument: loadedClass } = await import('pdf-lib');
        PDFDocumentClass = loadedClass;
        pdfDoc = await PDFDocumentClass.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`PDF has ${pageCount} pages. Splitting into chunks...`);

        const PAGES_PER_CHUNK = 5; // Safe limit
        const totalChunks = Math.ceil(pageCount / PAGES_PER_CHUNK);
        const chunks: { index: number; buffer: Buffer }[] = [];

        // 1. Prepare all chunk buffers upfront
        for (let i = 0; i < pageCount; i += PAGES_PER_CHUNK) {
            const end = Math.min(i + PAGES_PER_CHUNK, pageCount);
            const subPdf = await PDFDocumentClass.create();
            const copiedPages = await subPdf.copyPages(pdfDoc, Array.from({ length: end - i }, (_, k) => i + k));
            copiedPages.forEach(page => subPdf.addPage(page));

            const pdfBytes = await subPdf.save();
            chunks.push({
                index: Math.floor(i / PAGES_PER_CHUNK),
                buffer: Buffer.from(pdfBytes)
            });
        }

        // 2. Define chunk execution tasks
        const tasks = chunks.map(chunk => async () => {
            const currentChunk = chunk.index + 1;
            let chunkAttempts = 0;
            let chunkSuccess = false;
            let chunkText = '';

            while (!chunkSuccess && chunkAttempts < 2) {
                try {
                    if (onProgress) onProgress(`Memproses Chunk OCR ${currentChunk} dari ${totalChunks}...`);
                    chunkText = await extractChunkWithVision(chunk.buffer, chunk.index);
                    chunkSuccess = true;
                } catch (e) {
                    console.error(`Chunk error (attempt ${chunkAttempts + 1}):`, e);
                    chunkAttempts++;
                    if (chunkAttempts < 2) {
                        if (onProgress) onProgress(`Chunk ${currentChunk} gagal, retry ${chunkAttempts} dari 1...`);
                        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                    }
                }
            }
            if (!chunkSuccess) {
                if (onProgress) onProgress(`Mendeteksi kendala, beralih ke OCR per halaman untuk Chunk ${currentChunk}...`);
                if (!pdfDoc) {
                    throw new Error('PDF document not loaded');
                }
                
                // Pages in this chunk
                const startPage = chunk.index * PAGES_PER_CHUNK;
                const endPage = Math.min(startPage + PAGES_PER_CHUNK, pageCount);
                
                const pageTasks: (() => Promise<string>)[] = [];
                
                for (let pageIndex = startPage; pageIndex < endPage; pageIndex++) {
                    pageTasks.push(async () => {
                        const subPdf = await PDFDocumentClass.create();
                        const [copiedPage] = await subPdf.copyPages(pdfDoc!, [pageIndex]);
                        subPdf.addPage(copiedPage);
                        const pageBytes = await subPdf.save();
                        const pageBuffer = Buffer.from(pageBytes);
                        
                        let pageRetries = 0;
                        let pageSuccess = false;
                        let pageText = '';
                        while (!pageSuccess && pageRetries <= 2) {
                            try {
                                pageText = await extractChunkWithVision(pageBuffer, pageIndex);
                                pageSuccess = true;
                            } catch (pageErr) {
                                console.error(`Page ${pageIndex + 1} error (retry ${pageRetries}):`, pageErr);
                                pageRetries++;
                                if (pageRetries <= 2) {
                                    const delay = pageRetries === 1 ? 2000 : 4000;
                                    if (onProgress) onProgress(`Mendeteksi kendala, Halaman ${pageIndex + 1} gagal, retry ${pageRetries} setelah ${delay / 1000}s...`);
                                    await new Promise(r => setTimeout(r, delay));
                                }
                            }
                        }
                        if (!pageSuccess) {
                            throw new Error(`Failed to extract text from page ${pageIndex + 1} after retries.`);
                        }
                        return pageText;
                    });
                }
                
                const pageResults = await runWithConcurrencyLimit(pageTasks, 2);
                chunkText = pageResults.join('\n\n');
            }
            return chunkText;
        });

        // 3. Load concurrency limit from env or default to 3
        const concurrencyLimitEnv = process.env.OCR_CONCURRENCY_LIMIT;
        const concurrencyLimit = concurrencyLimitEnv ? parseInt(concurrencyLimitEnv, 10) : 3;
        const finalLimit = isNaN(concurrencyLimit) ? 3 : concurrencyLimit;

        // 4. Run tasks concurrently using the pool helper
        const results = await runWithConcurrencyLimit(tasks, finalLimit);
        return results.join('\n\n');

    } catch (error) {
        console.warn('PDF loading/splitting failed, falling back to whole document OCR:', error);
        if (onProgress) onProgress('Mendeteksi kendala pemecahan dokumen, beralih ke OCR seluruh dokumen...');
        return await extractChunkWithVision(pdfBuffer, 0);
    }
}

/**
 * Helper to run async tasks with a limit on concurrency
 */
export async function runWithConcurrencyLimit<T>(
    tasks: (() => Promise<T>)[],
    limit: number
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < tasks.length) {
            const currentIndex = nextIndex++;
            results[currentIndex] = await tasks[currentIndex]();
        }
    }

    // Spawn up to `limit` workers
    const workers = Array.from(
        { length: Math.min(limit, tasks.length) },
        () => worker()
    );
    await Promise.all(workers);
    return results;
}
