import {
    buildImpactsFromAmar,
    getDefaultForumByRegulationType,
    inferOutcomeFromAmar,
    type JudicialDisposition,
    type JudicialForum,
    type JudicialOutcome
} from './judicial-review';

type SearchInput = {
    regulationType?: string;
    regulationTitle: string;
    number?: string;
    year?: number;
    forum?: JudicialForum;
};

export type ScrapedDecision = {
    forum: JudicialForum;
    decisionNumber: string;
    decisionDate?: Date;
    amarText: string;
    sourceUrl: string;
    rawText?: string;
    outcome: JudicialOutcome;
    impacts: Array<{
        articleNumber: string;
        disposition: JudicialDisposition;
        amarExcerpt?: string;
    }>;
};

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRequestHeaders(urlStr: string): Record<string, string> {
    let host = '';
    try {
        host = new URL(urlStr).hostname;
    } catch {
        // ignore
    }

    const headers: Record<string, string> = {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': urlStr.includes('Mobile') ? '?1' : '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
    };

    if (host) {
        headers['Host'] = host;
    }

    return headers;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url: string, timeoutMs = 15000, init?: RequestInit): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Random delay to avoid hitting rate limits (500ms to 1500ms)
    await delay(500 + Math.random() * 1000);

    try {
        const headers = {
            ...getRequestHeaders(url),
            ...(init?.headers || {})
        };

        const response = await fetch(url, {
            ...init,
            headers,
            signal: controller.signal
        });
        return response;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function stripHtmlTags(input: string): string {
    return input
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractUrlsFromSearchHtml(html: string): string[] {
    const matches = html.match(/https?:\/\/[^"'\s<>()]+/g) || [];
    const blocked = new Set(['duckduckgo.com', 'google.com', 'bing.com']);
    const urls = matches
        .map((url) => {
            try {
                return decodeURIComponent(url);
            } catch {
                return url;
            }
        })
        .map((url) => {
            try {
                const parsed = new URL(url);
                if (parsed.hostname.includes('duckduckgo.com')) {
                    const redirected = parsed.searchParams.get('uddg');
                    if (redirected) {
                        return decodeURIComponent(redirected);
                    }
                }
                return url;
            } catch {
                return url;
            }
        })
        .filter((url) => {
            try {
                const host = new URL(url).hostname;
                return !Array.from(blocked).some((domain) => host.includes(domain));
            } catch {
                return false;
            }
        });

    const directEncodedMatches = html.match(/uddg=([^&"'\s<>()]+)/g) || [];
    for (const encoded of directEncodedMatches) {
        const value = encoded.replace(/^uddg=/, '');
        try {
            const decoded = decodeURIComponent(value);
            const host = new URL(decoded).hostname;
            if (!Array.from(blocked).some((domain) => host.includes(domain))) {
                urls.push(decoded);
            }
        } catch {
            // Ignore malformed URL fragments from search HTML.
        }
    }

    return Array.from(new Set(urls)).slice(0, 8);
}

function extractAmarText(cleanText: string): string | null {
    const markers = ['amar putusan', 'mengadili', 'putusan'];
    const normalized = cleanText.toLowerCase();
    let bestIndex = -1;

    for (const marker of markers) {
        const idx = normalized.indexOf(marker);
        if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
            bestIndex = idx;
        }
    }

    if (bestIndex === -1) {
        return null;
    }

    const excerpt = cleanText.slice(bestIndex, bestIndex + 3000).trim();
    return excerpt.length > 80 ? excerpt : null;
}

function extractDecisionNumber(cleanText: string): string | null {
    const patterns = [
        /Nomor\s+([0-9A-Za-z\-\/\.\s]+?)\s+Tahun/gi,
        /Putusan\s+Nomor\s+([0-9A-Za-z\-\/\.\s]+)/gi,
        /No\.?\s*([0-9A-Za-z\-\/\.]+)/gi
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(cleanText);
        if (match?.[1]) {
            return match[1].replace(/\s+/g, ' ').trim().slice(0, 120);
        }
    }

    return null;
}

function extractDecisionDate(cleanText: string): Date | undefined {
    const match = cleanText.match(/(\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i);
    if (!match) {
        return undefined;
    }

    const date = new Date(match[1]);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date;
}

async function searchUrls(query: string): Promise<string[]> {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetchWithTimeout(url, 12000);

    if (!response || !response.ok) {
        return [];
    }

    const html = await response.text();
    return extractUrlsFromSearchHtml(html);
}

async function scrapeDecisionDetail(url: string, forum: JudicialForum): Promise<ScrapedDecision | null> {
    try {
        const response = await fetchWithTimeout(url, 15000);
        if (!response || !response.ok) {
            return null;
        }

        const html = await response.text();
        const cleanText = stripHtmlTags(html);
        const amarText = extractAmarText(cleanText);

        if (!amarText) {
            return null;
        }

        const decisionNumber = extractDecisionNumber(cleanText);
        if (!decisionNumber) {
            return null;
        }

        const outcome = inferOutcomeFromAmar(amarText);

        return {
            forum,
            decisionNumber,
            decisionDate: extractDecisionDate(cleanText),
            amarText,
            sourceUrl: url,
            rawText: cleanText.slice(0, 10000),
            outcome,
            impacts: buildImpactsFromAmar(amarText, outcome)
        };
    } catch {
        return null;
    }
}

export async function searchJudicialReviews(input: SearchInput): Promise<ScrapedDecision[]> {
    const forum = input.forum || getDefaultForumByRegulationType(input.regulationType);
    const qCore = `${input.regulationTitle} ${input.number || ''} ${input.year || ''}`.trim();
    const mkQuery = `site:mkri.id putusan pengujian undang-undang ${qCore} amar putusan`;
    const maQuery = `site:mahkamahagung.go.id OR site:putusan3.mahkamahagung.go.id putusan uji materi ${qCore} amar putusan`;

    const queries = forum === 'MK' ? [mkQuery] : [maQuery];
    const candidates = new Set<string>();

    for (const query of queries) {
        try {
            const urls = await searchUrls(query);
            for (const url of urls) {
                candidates.add(url);
            }
        } catch {
            // Ignore individual source failures; sync can still return partial results.
        }
    }

    const results: ScrapedDecision[] = [];

    for (const url of candidates) {
        const decision = await scrapeDecisionDetail(url, forum);
        if (decision) {
            results.push(decision);
        }
        if (results.length >= 5) {
            break;
        }
    }

    return results;
}
