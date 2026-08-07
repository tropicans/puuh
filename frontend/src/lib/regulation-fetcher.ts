/**
 * Regulation Fetcher Service
 * Automatically finds and downloads regulations from JDIH websites
 * 
 * 3-Strategy Pipeline:
 *  1. BPK Search Scraping (primary) — scrapes peraturan.bpk.go.id/Search
 *  2. Direct URL Patterns (fallback) — tries known URL structures
 *  3. LLM Search (last resort) — asks AI to help find the URL
 */

const LLM_BASE_URL = process.env.OPENAI_BASE_URL;
const LLM_API_KEY = process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.OPENAI_MODEL || 'gpt-oss-120b-medium';

const BPK_BASE = 'https://peraturan.bpk.go.id';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FetchResult {
    success: boolean;
    rawText?: string;
    sourceUrl?: string;
    numPages?: number;
    error?: string;
    ocrUsed?: boolean;
    title?: string;
    extractionMethod?: string;
}

export interface RegulationInfo {
    type: string;      // Perpres, PP, UU, Permen, etc.
    number: string;    // 82
    year: number;      // 2018
    title?: string;    // tentang Jaminan Kesehatan (optional)
}

/** Callback for streaming progress updates */
export type ProgressCallback = (message: string) => void;

// ─── Type Mapping ────────────────────────────────────────────────────────────

/** Map short type names to BPK jenis parameter and full names */
const TYPE_MAP: Record<string, { bpkJenis: string; fullName: string; bpkSlugPrefix: string }> = {
    'perpres': { bpkJenis: 'Perpres', fullName: 'Peraturan Presiden', bpkSlugPrefix: 'perpres' },
    'peraturan presiden': { bpkJenis: 'Perpres', fullName: 'Peraturan Presiden', bpkSlugPrefix: 'perpres' },
    'pp': { bpkJenis: 'PP', fullName: 'Peraturan Pemerintah', bpkSlugPrefix: 'pp' },
    'peraturan pemerintah': { bpkJenis: 'PP', fullName: 'Peraturan Pemerintah', bpkSlugPrefix: 'pp' },
    'uu': { bpkJenis: 'UU', fullName: 'Undang-Undang', bpkSlugPrefix: 'uu' },
    'undang-undang': { bpkJenis: 'UU', fullName: 'Undang-Undang', bpkSlugPrefix: 'uu' },
    'permen': { bpkJenis: 'Permen', fullName: 'Peraturan Menteri', bpkSlugPrefix: 'permen' },
    'peraturan menteri': { bpkJenis: 'Permen', fullName: 'Peraturan Menteri', bpkSlugPrefix: 'permen' },
    'perda': { bpkJenis: 'Perda', fullName: 'Peraturan Daerah', bpkSlugPrefix: 'perda' },
    'peraturan daerah': { bpkJenis: 'Perda', fullName: 'Peraturan Daerah', bpkSlugPrefix: 'perda' },
    'permendagri': { bpkJenis: 'Permendagri', fullName: 'Peraturan Menteri Dalam Negeri', bpkSlugPrefix: 'permendagri' },
    'permenkes': { bpkJenis: 'Permenkes', fullName: 'Peraturan Menteri Kesehatan', bpkSlugPrefix: 'permenkes' },
    'kepres': { bpkJenis: 'Kepres', fullName: 'Keputusan Presiden', bpkSlugPrefix: 'kepres' },
    'keputusan presiden': { bpkJenis: 'Kepres', fullName: 'Keputusan Presiden', bpkSlugPrefix: 'kepres' },
    'inpres': { bpkJenis: 'Inpres', fullName: 'Instruksi Presiden', bpkSlugPrefix: 'inpres' },
};

function resolveType(type: string): { bpkJenis: string; fullName: string; bpkSlugPrefix: string } {
    const lower = type.toLowerCase().trim();
    return TYPE_MAP[lower] || { bpkJenis: type, fullName: type, bpkSlugPrefix: type.toLowerCase() };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response | null> {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
                    ...(options?.headers || {}),
                },
                redirect: 'follow',
            });
            if (response.ok) return response;
            if (response.status === 429 && i < retries) {
                console.log(`Rate limited, retrying in ${(i + 1) * 2}s...`);
                await sleep((i + 1) * 2000);
                continue;
            }
            console.log(`HTTP ${response.status} for ${url}`);
            return null;
        } catch (error) {
            if (i < retries) {
                await sleep(1000);
                continue;
            }
            console.log(`Fetch error for ${url}:`, error);
            return null;
        }
    }
    return null;
}

// ─── Strategy 1: BPK Search Scraping ─────────────────────────────────────────

interface BPKSearchResult {
    detailUrl: string;
    downloadUrl: string | null;
    title: string;
    slug: string;
}

/**
 * Search peraturan.bpk.go.id and extract matching regulation PDF download links.
 * The search HTML contains both detail links (/Details/ID/slug) and 
 * download links (/Download/ID/filename.pdf) inline.
 */
async function searchBPK(info: RegulationInfo, onProgress?: ProgressCallback): Promise<BPKSearchResult[]> {
    const typeInfo = resolveType(info.type);
    const searchUrl = `${BPK_BASE}/Search?nomor=${encodeURIComponent(info.number)}&tahun=${info.year}`;

    onProgress?.(`Mencari di JDIH BPK: ${typeInfo.bpkJenis} No. ${info.number} Tahun ${info.year}...`);
    console.log(`BPK Search: ${searchUrl}`);

    const response = await fetchWithRetry(searchUrl);
    if (!response) {
        console.log('BPK search failed: no response');
        return [];
    }

    const html = await response.text();
    const results: BPKSearchResult[] = [];

    // Parse search results card by card
    const cardBlocks = html.split('<div class="card">');
    if (cardBlocks.length > 1) {
        for (const card of cardBlocks.slice(1)) {
            // Extract details link
            const detailRegex = /href="(\/Details\/(\d+)\/([^"]+))"/i;
            const detailMatch = card.match(detailRegex);
            if (!detailMatch) continue;

            const [, detailPath, , slug] = detailMatch;

            // Extract download link inside the card
            const downloadRegex = /href="(\/Download\/(\d+)\/([^"]+\.pdf))"/i;
            const downloadMatch = card.match(downloadRegex);
            const downloadUrl = downloadMatch ? `${BPK_BASE}${downloadMatch[1]}` : null;

            // Try to extract full title snippet from text-gray-600 block
            const titleRegex = /class="[^"]*text-gray-600[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
            const titleMatch = card.match(titleRegex);
            let title = '';
            if (titleMatch) {
                title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            } else {
                // Fallback to details link text
                const anchorRegex = new RegExp(`<a[^>]*href="${detailPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([\s\S]*?)</a>`, 'i');
                const anchorMatch = card.match(anchorRegex);
                title = anchorMatch ? anchorMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : slug;
            }

            const decodedSlug = decodeURIComponent(slug).trim();
            const decodedTitle = decodeURIComponent(title).trim();

            results.push({
                detailUrl: `${BPK_BASE}${detailPath}`,
                downloadUrl,
                title: decodedTitle || decodedSlug,
                slug: decodedSlug,
            });
        }
    }

    // Fallback: If card-based parsing found nothing, use the old global regex parsing
    if (results.length === 0) {
        const downloadRegex = /href="(\/Download\/(\d+)\/([^"]+\.pdf))"/gi;
        const detailRegex = /href="(\/Details\/(\d+)\/([^"]+))"/gi;
        const detailPages = new Map<string, { url: string; slug: string; title: string }>();
        let detailMatch;
        while ((detailMatch = detailRegex.exec(html)) !== null) {
            const [, path, id, slug] = detailMatch;
            const titleRegex = new RegExp(`<a[^>]*href="${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]+)</a>`, 'i');
            const titleMatch = html.match(titleRegex);
            detailPages.set(id, {
                url: `${BPK_BASE}${path}`,
                slug,
                title: titleMatch?.[1]?.trim() || slug,
            });
        }
        let dlMatch;
        while ((dlMatch = downloadRegex.exec(html)) !== null) {
            const [, path, id, filename] = dlMatch;
            const detail = detailPages.get(id) || { url: `${BPK_BASE}/Details/${id}`, slug: filename, title: filename };
            results.push({
                detailUrl: detail.url,
                downloadUrl: `${BPK_BASE}${path}`,
                title: detail.title,
                slug: detail.slug,
            });
        }
    }

    // Filter results to match our regulation type and number
    const prefix = typeInfo.bpkSlugPrefix.toLowerCase();
    const numberStr = info.number;
    const yearStr = String(info.year);

    const filtered = results.filter(r => {
        const slug = r.slug.toLowerCase();
        const title = r.title.toLowerCase();
        const combined = `${slug} ${title}`;

        // Must match type prefix
        const typeMatch = combined.includes(prefix);
        // Must match number
        const numMatch = combined.includes(`no-${numberStr}`) ||
            combined.includes(`no.${numberStr}`) ||
            combined.includes(`no ${numberStr}`) ||
            combined.includes(`nomor-${numberStr}`) ||
            combined.includes(`nomor ${numberStr}`) ||
            combined.includes(`${numberStr}-tahun`) ||
            combined.includes(`${numberStr} tahun`);
        // Must match year
        const yearMatch = combined.includes(yearStr);

        return typeMatch && (numMatch || yearMatch);
    });

    // If strict filtering removed everything, return all results
    const finalResults = filtered.length > 0 ? filtered : results.slice(0, 5);

    // If any final candidate does not have a downloadUrl, fetch it from detail page
    for (const candidate of finalResults.slice(0, 3)) {
        if (!candidate.downloadUrl) {
            onProgress?.(`Mengambil link download dari halaman detail: ${candidate.title}...`);
            const dlUrl = await extractDownloadFromDetailPage(candidate.detailUrl);
            if (dlUrl) {
                candidate.downloadUrl = dlUrl;
            }
            await sleep(500);
        }
    }

    console.log(`BPK Search: found ${results.length} total, ${filtered.length} filtered, returning ${finalResults.length}`);
    return finalResults;
}

/**
 * Fetch a BPK detail page and extract the PDF download URL from it
 */
async function extractDownloadFromDetailPage(detailUrl: string): Promise<string | null> {
    const response = await fetchWithRetry(detailUrl);
    if (!response) return null;

    const html = await response.text();

    // Look for download links in the detail page
    const downloadRegex = /href="(\/Download\/\d+\/[^"]+\.pdf)"/gi;
    const match = downloadRegex.exec(html);
    return match ? `${BPK_BASE}${match[1]}` : null;
}

// ─── Strategy 2: Direct URL Patterns ─────────────────────────────────────────

function generatePossibleUrls(info: RegulationInfo): string[] {
    const { type, number, year } = info;
    const typeLower = type.toLowerCase();
    const paddedNumber = number.padStart(2, '0');

    const urls: string[] = [];

    if (typeLower === 'perpres' || typeLower === 'peraturan presiden') {
        urls.push(
            `https://jdih.setneg.go.id/viewpdfperaturan/Perpres%20Nomor%20${number}%20Tahun%20${year}.pdf`,
            `https://jdih.setneg.go.id/viewpdfperaturan/Perpres%20Nomor%20${number}%20Tahun%20${year}%20Produk%20setkab.pdf`,
            `https://jdih.setkab.go.id/PUUdoc/${year}${paddedNumber}_PERPRES%20${number}%20TAHUN%20${year}.pdf`,
            `https://jdih.setkab.go.id/PUUdoc/${year}0${number}_Perpres%20${number}%20Tahun%20${year}.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/perpres${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/perpres${number}-${year}.pdf`,
        );
    } else if (typeLower === 'pp' || typeLower === 'peraturan pemerintah') {
        urls.push(
            `https://jdih.setneg.go.id/viewpdfperaturan/PP%20Nomor%20${number}%20Tahun%20${year}.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/pp${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/pp${number}-${year}.pdf`,
        );
    } else if (typeLower === 'uu' || typeLower === 'undang-undang') {
        urls.push(
            `https://jdih.setneg.go.id/viewpdfperaturan/UU%20Nomor%20${number}%20Tahun%20${year}.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/uu${number}-${year}bt.pdf`,
            `https://peraturan.go.id/common/dokumen/ln/${year}/uu${number}-${year}.pdf`,
        );
    }

    return urls;
}

// ─── Strategy 3: LLM Fallback ────────────────────────────────────────────────

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
                throw new Error(`Failed to parse LLM response: ${rawText.substring(0, 200)}`);
            }
        } else {
            throw new Error(`Failed to parse LLM response: ${rawText.substring(0, 200)}`);
        }
    }
    return data.choices?.[0]?.message?.content || '';
}

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

        const urlMatch = response.match(/https?:\/\/[^\s<>"]+\.pdf/i);
        if (urlMatch) return urlMatch[0];

        const anyUrlMatch = response.match(/https?:\/\/[^\s<>"]+/i);
        if (anyUrlMatch && !response.includes('TIDAK_DITEMUKAN')) return anyUrlMatch[0];

        return null;
    } catch (error) {
        console.error('AI search error:', error);
        return null;
    }
}

// ─── PDF Download & Text Extraction ──────────────────────────────────────────

async function downloadPDF(url: string, onProgress?: ProgressCallback): Promise<Buffer | null> {
    try {
        onProgress?.(`Mengunduh PDF dari ${new URL(url).hostname}...`);
        console.log(`Downloading PDF: ${url}`);

        const response = await fetchWithRetry(url, {
            headers: {
                'Accept': 'application/pdf,application/octet-stream,*/*',
            },
        });

        if (!response) return null;

        const contentType = response.headers.get('content-type') || '';
        // Accept PDF, octet-stream, or if the URL ends in .pdf
        if (!contentType.includes('pdf') && !contentType.includes('octet-stream') && !url.toLowerCase().endsWith('.pdf')) {
            console.log(`Not a PDF: ${contentType}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        onProgress?.(`PDF diunduh: ${sizeMB} MB`);
        console.log(`Downloaded: ${buffer.length} bytes`);
        return buffer;
    } catch (error) {
        console.log(`Download error: ${error}`);
        return null;
    }
}

async function extractPDFText(pdfBuffer: Buffer, sourceUrl: string, onProgress?: ProgressCallback): Promise<FetchResult> {
    onProgress?.('Mengekstrak teks dari PDF...');

    try {
        const { smartExtractPdfText } = await import('./pdf-service');
        const result = await smartExtractPdfText(pdfBuffer, onProgress);
        
        let rawText = result.text;
        if (result.method !== 'docling') {
            rawText = `[PERINGATAN: Dokumen ini diproses menggunakan metode fallback (${result.method}). Struktur tabel mungkin tidak terurai dengan sempurna.]\n\n${result.text}`;
        }
        
        return {
            success: true,
            rawText,
            sourceUrl,
            numPages: result.numPages,
            ocrUsed: result.method === 'ocr',
            extractionMethod: result.method
        };
    } catch (e) {
        console.error('Text extraction failed:', e);
        return { success: false, error: 'Gagal mengekstrak teks dari PDF' };
    }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Main function to fetch regulation using 3-strategy pipeline.
 * Accepts an optional progress callback for streaming status updates.
 */
export async function fetchRegulation(info: RegulationInfo, onProgress?: ProgressCallback): Promise<FetchResult> {
    const typeInfo = resolveType(info.type);
    console.log(`\n=== Fetching: ${typeInfo.fullName} No. ${info.number} Tahun ${info.year} ===`);
    onProgress?.(`Memulai pencarian ${typeInfo.fullName} No. ${info.number} Tahun ${info.year}...`);

    // ── Strategy 1: BPK Search Scraping ──
    onProgress?.('Strategi 1: Mencari di database JDIH BPK...');
    try {
        const searchResults = await searchBPK(info, onProgress);

        if (searchResults.length > 0) {
            onProgress?.(`Ditemukan ${searchResults.length} hasil di JDIH BPK`);

            for (const result of searchResults) {
                if (!result.downloadUrl) continue;

                onProgress?.(`Mencoba: ${result.title}`);
                const pdfBuffer = await downloadPDF(result.downloadUrl, onProgress);
                if (pdfBuffer) {
                    const extractResult = await extractPDFText(pdfBuffer, result.downloadUrl, onProgress);
                    if (extractResult.success) {
                        extractResult.title = result.title;
                        return extractResult;
                    }
                }
                await sleep(500);
            }

            // If downloads failed, try detail pages for alternate download links
            for (const result of searchResults.slice(0, 3)) {
                onProgress?.(`Memeriksa halaman detail: ${result.title}...`);
                const dlUrl = await extractDownloadFromDetailPage(result.detailUrl);
                if (dlUrl && dlUrl !== result.downloadUrl) {
                    const pdfBuffer = await downloadPDF(dlUrl, onProgress);
                    if (pdfBuffer) {
                        const extractResult = await extractPDFText(pdfBuffer, dlUrl, onProgress);
                        if (extractResult.success) {
                            extractResult.title = result.title;
                            return extractResult;
                        }
                    }
                }
                await sleep(500);
            }
        } else {
            onProgress?.('Tidak ditemukan di JDIH BPK');
        }
    } catch (error) {
        console.error('BPK search strategy failed:', error);
        onProgress?.('Pencarian JDIH BPK gagal, mencoba strategi lain...');
    }

    // ── Strategy 2: Direct URL Patterns ──
    onProgress?.('Strategi 2: Mencoba URL pattern langsung...');
    const possibleUrls = generatePossibleUrls(info);

    for (const url of possibleUrls) {
        onProgress?.(`Mencoba: ${new URL(url).hostname}...`);
        const pdfBuffer = await downloadPDF(url, onProgress);
        if (pdfBuffer) {
            const result = await extractPDFText(pdfBuffer, url, onProgress);
            if (result.success) return result;
        }
    }

    // ── Strategy 3: LLM Search ──
    onProgress?.('Strategi 3: Meminta bantuan AI untuk mencari URL...');
    try {
        const aiUrl = await searchWithAI(info);
        if (aiUrl) {
            onProgress?.(`AI menyarankan: ${aiUrl}`);
            const pdfBuffer = await downloadPDF(aiUrl, onProgress);
            if (pdfBuffer) {
                const result = await extractPDFText(pdfBuffer, aiUrl, onProgress);
                if (result.success) return result;
            }
        } else {
            onProgress?.('AI tidak menemukan URL yang valid');
        }
    } catch (error) {
        console.error('AI search strategy failed:', error);
    }

    // All strategies failed
    onProgress?.('Semua strategi pencarian gagal');
    return {
        success: false,
        error: `Tidak dapat menemukan ${typeInfo.fullName} No. ${info.number} Tahun ${info.year} secara otomatis. Silakan upload manual.`
    };
}

// ─── Input Parsing ───────────────────────────────────────────────────────────

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
