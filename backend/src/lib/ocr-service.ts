/**
 * OCR Service using LLM Vision Models
 */
import config from '../config/index';
import pLimit from 'p-limit';

const LLM_BASE_URL = config.OPENAI_BASE_URL;
const LLM_API_KEY = config.OPENAI_API_KEY;
const VISION_MODEL = process.env.VISION_MODEL || 'glm-cn/glm-5.2';

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

    const rawText = await response.text();
    let data: { choices?: { message?: { content?: string } }[] };
    try {
        data = JSON.parse(rawText);
    } catch {
        const lastBrace = rawText.lastIndexOf('}');
        if (lastBrace > 0) {
            try {
                data = JSON.parse(rawText.substring(0, lastBrace + 1));
            } catch {
                throw new Error(`Failed to parse Vision API response: ${rawText.substring(0, 200)}`);
            }
        } else {
            throw new Error(`Failed to parse Vision API response: ${rawText.substring(0, 200)}`);
        }
    }
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
 * Extract text from a PDF chunk by converting pages to PNG via pdftoppm, then OCR each page
 */
async function extractChunkWithVision(pdfBuffer: Buffer, chunkIndex: number): Promise<string> {
    console.log(`Processing Chunk ${chunkIndex + 1} (${(pdfBuffer.length / 1024).toFixed(1)} KB)...`);

    const os = await import('os');
    const fs = await import('fs');
    const path = await import('path');
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const uniqueId = `${Date.now()}-${chunkIndex}`;
    const tmpDir = os.tmpdir();
    const tmpPdf = path.join(tmpDir, `ocr-chunk-${uniqueId}.pdf`);
    const tmpPrefix = path.join(tmpDir, `ocr-page-${uniqueId}`);

    try {
        // Write PDF buffer to temp file
        await fs.promises.writeFile(tmpPdf, pdfBuffer);

        // Convert PDF pages to PNG using pdftoppm (150 DPI = good quality/size balance)
        try {
            await execFileAsync('pdftoppm', ['-png', '-r', '150', tmpPdf, tmpPrefix]);
        } catch (e) {
            const err = e as NodeJS.ErrnoException;
            if (err.code === 'ENOENT') {
                throw new Error('pdftoppm not found - poppler-utils not installed');
            }
            throw e;
        }

        // Find all generated PNG files (pdftoppm naming: prefix-1.png, prefix-2.png, ...)
        const allFiles = await fs.promises.readdir(tmpDir);
        const prefixBase = path.basename(tmpPrefix);
        const pngFiles = allFiles
            .filter(f => f.startsWith(prefixBase) && (f.endsWith('.png') || f.endsWith('.ppm')))
            .sort()
            .map(f => path.join(tmpDir, f));

        if (pngFiles.length === 0) {
            throw new Error('pdftoppm produced no output files');
        }

        console.log(`Chunk ${chunkIndex + 1}: converted to ${pngFiles.length} page image(s), running OCR...`);

        // OCR each page image in parallel with a concurrency limit of 3
        const limit = pLimit(3);
        const ocrPromises = pngFiles.map((pngFile) =>
            limit(async () => {
                const pngBuffer = await fs.promises.readFile(pngFile);
                const pageText = await performOCR(pngBuffer);
                await fs.promises.unlink(pngFile).catch(() => {});
                return pageText;
            })
        );
        const results = await Promise.all(ocrPromises);
        const fullText = results.join('\n');

        console.log(`Chunk ${chunkIndex + 1} Result: ${fullText.length} chars`);
        return fullText;

    } finally {
        await fs.promises.unlink(tmpPdf).catch(() => {});
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

    try {
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`PDF has ${pageCount} pages. Splitting into chunks...`);

        let fullText = '';
        const PAGES_PER_CHUNK = 5; // Safe limit
        const totalChunks = Math.ceil(pageCount / PAGES_PER_CHUNK);

        for (let i = 0; i < pageCount; i += PAGES_PER_CHUNK) {
            const currentChunk = Math.floor(i / PAGES_PER_CHUNK) + 1;
            if (onProgress) onProgress(`Memproses Chunk OCR ${currentChunk} dari ${totalChunks}...`);

            const end = Math.min(i + PAGES_PER_CHUNK, pageCount);
            // Create new PDF with subset of pages
            const subPdf = await PDFDocument.create();
            const copiedPages = await subPdf.copyPages(pdfDoc, Array.from({ length: end - i }, (_, k) => i + k));
            copiedPages.forEach(page => subPdf.addPage(page));

            const pdfBytes = await subPdf.save();
            const chunkBuffer = Buffer.from(pdfBytes);

            // Retry logic for chunk
            let retries = 0;
            let success = false;

            while (!success && retries < 2) {
                try {
                    const chunkText = await extractChunkWithVision(chunkBuffer, i / PAGES_PER_CHUNK);
                    fullText += chunkText + '\n\n';
                    success = true;
                } catch (e) {
                    const err = e as Error;
                    console.error(`Chunk error (retry ${retries}):`, err);
                    if (onProgress) onProgress(`Chunk ${currentChunk} gagal, retry ${retries + 1}...`);
                    // 400 = bad request (format not supported), don't retry
                    if (err.message?.includes('400') || err.message?.includes('Improperly formed')) {
                        success = true; // skip this chunk, it won't work
                    } else {
                        retries++;
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }
        }

        return fullText;

    } catch (error) {
        console.error('Split & OCR failed:', error);
        throw error;
    }
}
