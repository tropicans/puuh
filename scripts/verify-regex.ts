
function parseArticlesWithRegex(rawText: string) {
    const articles: any[] = [];
    const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = normalizedText.split(/(?=\nPasal\s+\d+|Pasal\s+\d+)/i);

    for (const part of parts) {
        const headerMatch = part.match(/^(Pasal\s+\d+[A-Z]*)/i);
        if (headerMatch) {
            const number = headerMatch[1].trim();
            let content = part.substring(headerMatch[0].length).trim();
            const nextSectionMatch = content.match(/\n\s*(BAB|Bagian|Paragraf)\s+/i);
            if (nextSectionMatch) {
                content = content.substring(0, nextSectionMatch.index).trim();
            }
            content = content.replace(/\n\s*(- \d+ -|PRESIDEN REPUBLIK INDONESIA)\s*$/i, '');
            if (content.length > 2) {
                articles.push({ number, content });
            }
        }
    }
    return articles;
}

const testText = `
PERATURAN PRESIDEN REPUBLIK INDONESIA
NOMOR 82 TAHUN 2018
TENTANG
JAMINAN KESEHATAN

Pasal 1
Dalam Peraturan Presiden ini yang dimaksud dengan:
1. Jaminan Kesehatan adalah...

Pasal 2
Peserta Jaminan Kesehatan adalah...

BAB II
PESERTA

Pasal 3
Setiap penduduk Indonesia wajib ikut...
Pasal 4
Peserta sebagaimana dimaksud...
`;

const results = parseArticlesWithRegex(testText);
console.log(`Found ${results.length} articles:`);
results.forEach(a => console.log(`- ${a.number}: ${a.content.substring(0, 30)}...`));

if (results.length === 4) {
    console.log("SUCCESS: All articles found!");
} else {
    console.log(`FAILURE: Expected 4 articles, but found ${results.length}`);
    process.exit(1);
}
