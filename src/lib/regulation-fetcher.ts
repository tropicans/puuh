/**
 * Regulation Fetcher Service
 * Automatically finds and downloads regulations from JDIH websites
 */

import { extractTextWithVision } from './ocr-service';

const LLM_BASE_URL = process.env.OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1';
const LLM_API_KEY = process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.OPENAI_MODEL || 'gpt-oss-120b-medium';

interface FetchResult {
    success: boolean;
    rawText?: string;
    sourceUrl?: string;
    numPages?: number;
    error?: string;
    ocrUsed?: boolean;
}

interface RegulationInfo {
    type: string;      // Perpres, PP, UU, etc.
    number: string;    // 82
    year: number;      // 2018
    title?: string;    // tentang Jaminan Kesehatan (optional)
}

/**
 * Call LLM to get help finding regulation
 */
async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${LLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: LLM_MODEL,
            messages,
            max_tokens: 2000,
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        throw new Error(`LLM Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * Known URL patterns for JDIH sites
 * BPK JDIH uses dynamic IDs so direct URL guessing is unreliable
 * Setkab has more predictable patterns for Perpres
 */
function generatePossibleUrls(info: RegulationInfo): string[] {
    const { type, number, year } = info;
    const typeLower = type.toLowerCase();
    const paddedNumber = number.padStart(2, '0');

    const urls: string[] = [];

    if (typeLower === 'perpres' || typeLower === 'peraturan presiden') {
        // Setkab patterns (more reliable for Perpres)
        urls.push(
            // Common setkab pattern
            `https://jdih.setkab.go.id/PUUdoc/${year}${paddedNumber}_PERPRES%20${number}%20TAHUN%20${year}.pdf`,
            `https://jdih.setkab.go.id/PUUdoc/${year}0${number}_Perpres%20${number}%20Tahun%20${year}.pdf`,
            // Alternative patterns
            `https://peraturan.go.id/common/dokumen/ln/${year}/perpres${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/perpres${number}-${year}.pdf`,
        );
    } else if (typeLower === 'pp' || typeLower === 'peraturan pemerintah') {
        urls.push(
            `https://peraturan.go.id/common/dokumen/ln/${year}/pp${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/pp${number}-${year}.pdf`,
        );
    } else if (typeLower === 'uu' || typeLower === 'undang-undang') {
        urls.push(
            `https://peraturan.go.id/common/dokumen/ln/${year}/uu${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/uu${number}-${year}.pdf`,
        );
    }

    return urls;
}

/**
 * Try to download PDF from a URL
 */
async function downloadPDF(url: string): Promise<Buffer | null> {
    try {
        console.log(`Trying to download from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/pdf,*/*'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            console.log(`Failed: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
            console.log(`Not a PDF: ${contentType}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.log(`Download error: ${error}`);
        return null;
    }
}

/**
 * Use AI to search for regulation URL
 */
async function searchWithAI(info: RegulationInfo): Promise<string | null> {
    const { type, number, year } = info;

    try {
        const response = await callLLM([
            {
                role: 'system',
                content: `Anda adalah asisten yang membantu mencari URL dokumen peraturan Indonesia.
Anda hanya memberikan URL langsung ke file PDF, bukan halaman web.

Sumber yang valid:
- peraturan.bpk.go.id
- jdih.setkab.go.id  
- jdih.setneg.go.id
- peraturan.go.id

Output hanya URL saja, tanpa markup atau penjelasan.
Jika tidak tahu URL pasti, output: TIDAK_DITEMUKAN`
            },
            {
                role: 'user',
                content: `Cari URL PDF untuk: ${type} Nomor ${number} Tahun ${year}`
            }
        ]);

        // Extract URL from response
        const urlMatch = response.match(/https?:\/\/[^\s<>"]+\.pdf/i);
        if (urlMatch) {
            return urlMatch[0];
        }

        // Try to find any URL
        const anyUrlMatch = response.match(/https?:\/\/[^\s<>"]+/i);
        if (anyUrlMatch && !response.includes('TIDAK_DITEMUKAN')) {
            return anyUrlMatch[0];
        }

        return null;
    } catch (error) {
        console.error('AI search error:', error);
        return null;
    }
}

/**
 * Try to extract text from PDF, with Vision OCR fallback
 */
async function extractPDFText(pdfBuffer: Buffer, sourceUrl: string): Promise<FetchResult> {
    // First try pdf-parse for text-based PDFs
    try {
        // Dynamic require to avoid ESM issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(pdfBuffer);
        if (pdfData.text && pdfData.text.length > 500) {
            console.log(`PDF text extraction successful: ${pdfData.text.length} chars`);
            return {
                success: true,
                rawText: pdfData.text,
                sourceUrl,
                numPages: pdfData.numpages,
                ocrUsed: false
            };
        }
        console.log(`PDF text too short (${pdfData.text?.length || 0} chars), trying Vision OCR...`);
    } catch (e) {
        console.log('PDF text extraction failed, trying Vision OCR...', e);
    }

    // Fallback to Vision OCR for scanned PDFs
    try {
        const ocrText = await extractTextWithVision(pdfBuffer);
        if (ocrText && ocrText.length > 200) {
            console.log(`Vision OCR successful: ${ocrText.length} chars`);
            return {
                success: true,
                rawText: ocrText,
                sourceUrl,
                ocrUsed: true
            };
        }
    } catch (e) {
        console.error('Vision OCR failed:', e);
    }

    return { success: false, error: 'Failed to extract text from PDF' };
}

/**
 * Main function to fetch regulation
 */
export async function fetchRegulation(info: RegulationInfo): Promise<FetchResult> {
    console.log(`Fetching: ${info.type} No. ${info.number} Tahun ${info.year}`);

    // Strategy 1: Try known URL patterns
    const possibleUrls = generatePossibleUrls(info);

    for (const url of possibleUrls) {
        const pdfBuffer = await downloadPDF(url);
        if (pdfBuffer) {
            const result = await extractPDFText(pdfBuffer, url);
            if (result.success) {
                return result;
            }
        }
    }

    // Strategy 2: Use AI to find URL
    console.log('Pattern URLs failed, trying AI search...');
    const aiUrl = await searchWithAI(info);

    if (aiUrl) {
        const pdfBuffer = await downloadPDF(aiUrl);
        if (pdfBuffer) {
            const result = await extractPDFText(pdfBuffer, aiUrl);
            if (result.success) {
                return result;
            }
        }
    }

    return {
        success: false,
        error: `Tidak dapat menemukan ${info.type} No. ${info.number} Tahun ${info.year} secara otomatis. Silakan upload manual.`
    };
}

/**
 * Get regulation info from AI based on partial input
 */
export async function parseRegulationInput(input: string): Promise<RegulationInfo | null> {
    try {
        const response = await callLLM([
            {
                role: 'system',
                content: `Parse input peraturan Indonesia ke format JSON.
Output HANYA JSON, tidak ada teks lain:
{"type": "Perpres|PP|UU|Permen", "number": "82", "year": 2018}

Contoh:
- "perpres 82 2018" → {"type": "Perpres", "number": "82", "year": 2018}
- "PP No 35 Tahun 2021" → {"type": "PP", "number": "35", "year": 2021}`
            },
            {
                role: 'user',
                content: input
            }
        ]);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as RegulationInfo;
        }

        return null;
    } catch (error) {
        console.error('Parse error:', error);
        return null;
    }
}
