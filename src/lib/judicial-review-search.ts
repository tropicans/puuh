import {
    buildImpactsFromAmar,
    getDefaultForumByRegulationType,
    inferOutcomeFromAmar,
    type JudicialDisposition,
    type JudicialForum,
    type JudicialOutcome
} from '@/lib/judicial-review';

type SearchInput = {
    regulationType?: string;
    regulationTitle: string;
    number?: string;
    year?: number;
    forum?: JudicialForum;
};

type ScrapedDecision = {
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

async function fetchWithTimeout(url: string, timeoutMs = 15000, init?: RequestInit): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...init,
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
    const response = await fetchWithTimeout(url, 12000, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PUUTrackerBot/1.0)'
        }
    });

    if (!response || !response.ok) {
        return [];
    }

    const html = await response.text();
    return extractUrlsFromSearchHtml(html);
}

async function scrapeDecisionDetail(url: string, forum: JudicialForum): Promise<ScrapedDecision | null> {
    try {
        const response = await fetchWithTimeout(url, 15000, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PUUTrackerBot/1.0)'
            }
        });
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
