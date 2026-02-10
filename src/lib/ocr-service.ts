/**
 * OCR Service using LLM Vision Models
 * Uses proxy.kelazz.my.id vision-capable models for OCR
 */

const LLM_BASE_URL = process.env.OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1';
const LLM_API_KEY = process.env.OPENAI_API_KEY || '';
const VISION_MODEL = 'gemini-2.5-flash'; // Vision-capable model

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
                    console.error(`Chunk error (retry ${retries}):`, e);
                    if (onProgress) onProgress(`Chunk ${currentChunk} gagal, retry ${retries + 1}...`);
                    // If chunk too large, maybe needed single page? (complex)
                    // For now just retry
                    retries++;
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                }
            }
        }

        return fullText;

    } catch (error) {
        console.error('Split & OCR failed:', error);
        throw error;
    }
}
