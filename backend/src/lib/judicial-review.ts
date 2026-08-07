export type JudicialForum = 'MK' | 'MA';

export type JudicialOutcome =
    | 'GRANTED'
    | 'PARTIALLY_GRANTED'
    | 'REJECTED'
    | 'INADMISSIBLE'
    | 'WITHDRAWN'
    | 'OTHER';

export type JudicialDisposition =
    | 'INVALIDATED'
    | 'UPHELD'
    | 'CONDITIONALLY_VALID'
    | 'CONDITIONALLY_INVALID'
    | 'NO_DIRECT_EFFECT';

type ParsedImpact = {
    articleNumber: string;
    disposition: JudicialDisposition;
    amarExcerpt?: string;
};

function normalizeText(input: string): string {
    return input.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function normalizeArticleNumber(articleNumber: string): string {
    return articleNumber
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function getDefaultForumByRegulationType(shortName?: string | null): JudicialForum {
    const normalized = (shortName || '').toLowerCase().trim();
    return normalized === 'uu' || normalized === 'undang-undang' ? 'MK' : 'MA';
}

export function inferOutcomeFromAmar(amarText: string): JudicialOutcome {
    const text = normalizeText(amarText);

    if (text.includes('tidak dapat diterima') || text.includes('niet ontvankelijk')) {
        return 'INADMISSIBLE';
    }
    if (text.includes('ditarik kembali') || text.includes('mencabut permohonan')) {
        return 'WITHDRAWN';
    }
    if (
        (text.includes('mengabulkan') || text.includes('dikabulkan')) && 
        text.includes('seluruhnya')
    ) {
        return 'GRANTED';
    }
    if (
        (text.includes('mengabulkan') || text.includes('dikabulkan')) && 
        text.includes('sebagian')
    ) {
        return 'PARTIALLY_GRANTED';
    }
    if (text.includes('menolak permohonan')) {
        return 'REJECTED';
    }

    return 'OTHER';
}

export function inferDispositionFromExcerpt(excerpt: string, outcome: JudicialOutcome): JudicialDisposition {
    const text = normalizeText(excerpt);

    if (
        text.includes('tidak mempunyai kekuatan hukum mengikat') ||
        text.includes('dinyatakan tidak berlaku') ||
        text.includes('batal') ||
        text.includes('dicabut') ||
        text.includes('bertentangan dengan')
    ) {
        return 'INVALIDATED';
    }

    if (text.includes('inkonstitusional bersyarat')) {
        return 'CONDITIONALLY_INVALID';
    }

    if (text.includes('konstitusional bersyarat')) {
        return 'CONDITIONALLY_VALID';
    }

    if (outcome === 'REJECTED' || outcome === 'INADMISSIBLE') {
        return 'UPHELD';
    }

    return 'NO_DIRECT_EFFECT';
}

export function extractArticleNumbersFromText(text: string): string[] {
    const matches = text.match(/Pasal\s+\d+[A-Z]?(?:\s+ayat\s+\(\d+\))?/gi) || [];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const match of matches) {
        const cleaned = match.replace(/\s+/g, ' ').trim();
        const key = normalizeArticleNumber(cleaned);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(cleaned);
        }
    }

    return result;
}

export function buildImpactsFromAmar(amarText: string, outcome?: JudicialOutcome): ParsedImpact[] {
    const resolvedOutcome = outcome || inferOutcomeFromAmar(amarText);
    const articleNumbers = extractArticleNumbersFromText(amarText);

    return articleNumbers.map((articleNumber) => ({
        articleNumber,
        disposition: inferDispositionFromExcerpt(amarText, resolvedOutcome),
        amarExcerpt: amarText.slice(0, 1200)
    }));
}

export function isInvalidatingDisposition(disposition: JudicialDisposition): boolean {
    return disposition === 'INVALIDATED' || disposition === 'CONDITIONALLY_INVALID';
}
