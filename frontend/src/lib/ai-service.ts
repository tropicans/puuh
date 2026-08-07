// AI Service untuk parsing dan analisis peraturan
// Menggunakan direct fetch untuk kompatibilitas dengan custom proxy

const MODEL = process.env.OPENAI_MODEL || 'gpt-oss-120b-medium';

export interface ParsedArticle {
    number: string;
    content: string;
}

export interface ChangeAnalysis {
    summary: string;
    significance: 'minor' | 'moderate' | 'major';
    affectedTopics: string[];
}

// Helper function untuk memanggil LLM
async function callLLM(messages: { role: string; content: string }[], maxTokens: number = 4000, temperature: number = 0.1): Promise<string> {
    const baseUrl = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('OPENAI_BASE_URL and OPENAI_API_KEY must be configured');

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            max_tokens: maxTokens,
            temperature,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API Error: ${response.status} ${errorText}`);
    }

    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return data.choices?.[0]?.message?.content || '';
    } catch {
        // Some proxies return malformed JSON with trailing garbage — try to extract valid prefix
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace > 0) {
            const truncated = text.substring(0, lastBrace + 1);
            try {
                const data = JSON.parse(truncated);
                return data.choices?.[0]?.message?.content || '';
            } catch {
                // fall through to throw
            }
        }
        throw new Error(`Failed to parse LLM response JSON: ${text.substring(0, 200)}`);
    }
}

/**
 * Parse raw text dari PDF untuk mengekstrak pasal-pasal
 * Handles large texts by processing in chunks
 */
export async function parseArticlesFromText(rawText: string): Promise<ParsedArticle[]> {
    // For very large texts, use regex parsing for reliability
    // AI parsing of 100+ articles is unreliable due to context limits
    if (rawText.length > 20000) {
        console.log(`Using regex parsing for large text (${rawText.length} chars)`);
        return parseArticlesWithRegex(rawText);
    }

    try {
        const content = await callLLM([
            {
                role: 'system',
                content: `Anda adalah asisten hukum Indonesia yang ahli dalam mengekstrak pasal peraturan.
Tugas Anda menjabarkan SEMUA pasal dari teks yang diberikan.

Output Murni JSON array:
[
  {"number": "Pasal 1", "content": "isi lengkap..."},
  {"number": "Pasal 2", "content": "isi lengkap..."}
]

Aturan Keras:
1. EKSTRAK SEMUA PASAL. Jangan ada yang terlewat.
2. Jangan merangkum. Salin verbatim (kata per kata).
3. Tangkap juga pasal sisipan (contoh: Pasal 6A, Pasal 103A).
4. Jika teks adalah peraturan "Perubahan" (amandemen), Anda hanya boleh mengekstrak pasal-pasal yang memuat teks perubahan baru atau pasal yang diubah. Abaikan teks rujukan lama/sebelumnya yang disertakan dalam dokumen tetapi tidak mengalami perubahan baru.
5. Abaikan header/footer halaman.
6. Pastikan nomor pasal lengkap (misal: "Pasal 1", bukan hanya "1").
7. **Aturan Keras tentang Tabel:** Jika terdapat tabel di dalam teks (format Markdown Table dari Docling), Anda dilarang merangkum, mengubah, atau menyederhanakan tabel tersebut. Salin tabel Markdown tersebut APA ADANYA secara lengkap di dalam field "content" pasal terkait.
8. **Aturan Keras tentang List:** Pertahankan format list Markdown asli. Dilarang menggabungkan list hierarkis menjadi satu paragraf tunggal. Anda wajib mempertahankan indentasi list dan simbol penandanya (seperti "- a.", "  - 1.", dll) agar struktur hierarkinya tetap terjaga.`
            },
            {
                role: 'user',
                content: `Ekstrak semua pasal dari teks berikut:\n\n${rawText}`
            }
        ], 12000, 0); // Increased tokens, 0 temp for determinism

        // Parse JSON dari response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const aiArticles = JSON.parse(jsonMatch[0]) as ParsedArticle[];

            // Validation: Compare the count of "Pasal" occurrences in rawText vs. aiArticles.length
            const originalPasalCount = (rawText.match(/\bPasal\s+\d+/gi) || []).length;

            // If the discrepancy is significant, fallback to regex.
            // A discrepancy is significant if the AI articles length is extremely low compared to original count (under-parsing/truncation).
            // Since some "Pasal <number>" are references (e.g. "sebagaimana dimaksud dalam Pasal 3"), originalPasalCount can be slightly larger.
            // But if AI parses less than 60% of original occurrences, or the absolute difference is greater than 3 (and original count is not trivial), trigger fallback.
            const isSignificantDiscrepancy = originalPasalCount >= 3 && (
                aiArticles.length < originalPasalCount * 0.6 ||
                (originalPasalCount - aiArticles.length) > 3
            );

            // Validation: IF AI returns very few articles but text is long, suspect truncation
            if ((rawText.length > 5000 && aiArticles.length < 3) || isSignificantDiscrepancy) {
                console.log(`AI parsed too few articles (${aiArticles.length} parsed vs. ${originalPasalCount} occurrences in text), falling back to regex`);
                return parseArticlesWithRegex(rawText);
            }
            return aiArticles;
        }

        console.log('AI failed to produce JSON, falling back to regex');
        return parseArticlesWithRegex(rawText);
    } catch (error) {
        console.error('Error parsing articles with AI:', error);
        // Fallback ke regex parsing
        return parseArticlesWithRegex(rawText);
    }
}

/**
 * Fallback: parse pasal dengan regex jika AI gagal
 * Improved to handle alphanumeric articles (103A) and standard formats
 */
function parseArticlesWithRegex(rawText: string): ParsedArticle[] {
    const articles: ParsedArticle[] = [];

    // Normalize line endings and clean up text
    const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split by "Pasal" keyword followed by number/alphanumeric
    // Improved regex to catch "Pasal 1" even if not preceded by a newline (handles OCR artifacts)
    const parts = normalizedText.split(/(?=\nPasal\s+\d+|Pasal\s+\d+)/i);

    for (const part of parts) {
        // Check if this part starts with "Pasal"
        const headerMatch = part.match(/^(Pasal\s+\d+[A-Z]*)/i);
        if (headerMatch) {
            const number = headerMatch[1].trim();
            // Get content after the "Pasal X" header
            let content = part.substring(headerMatch[0].length).trim();

            // Remove trailing BAB/Bagian/Paragraf sections that might have been captured
            const nextSectionMatch = content.match(/\n\s*(BAB|Bagian|Paragraf)\s+/i);
            if (nextSectionMatch) {
                content = content.substring(0, nextSectionMatch.index).trim();
            }

            // Remove typical "trash" end lines if any
            content = content.replace(/\n\s*(- \d+ -|PRESIDEN REPUBLIK INDONESIA)\s*$/i, '');

            if (content.length > 2) {
                articles.push({ number, content });
            }
        }
    }

    console.log(`Regex parsing found ${articles.length} articles`);
    return articles;
}

/**
 * Analisis perubahan antara dua versi pasal menggunakan AI
 */
export async function analyzeArticleChange(
    oldContent: string,
    newContent: string,
    articleNumber: string
): Promise<ChangeAnalysis> {
    try {
        const content = await callLLM([
            {
                role: 'system',
                content: `Anda adalah asisten hukum Indonesia. Analisis perubahan pasal peraturan.
          
Output JSON:
{
  "summary": "ringkasan perubahan dalam 1-2 kalimat",
  "significance": "minor|moderate|major",
  "affectedTopics": ["topik1", "topik2"]
}

Kriteria significance:
- minor: perubahan redaksional, tidak mengubah substansi
- moderate: perubahan substansi yang tidak signifikan
- major: perubahan substansi yang signifikan, misalnya penambahan hak/kewajiban baru`
            },
            {
                role: 'user',
                content: `Analisis perubahan ${articleNumber}:

VERSI LAMA:
${oldContent}

VERSI BARU:
${newContent}`
            }
        ], 500, 0.3);

        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as ChangeAnalysis;
        }

        return {
            summary: 'Terdapat perubahan pada pasal ini',
            significance: 'moderate',
            affectedTopics: []
        };
    } catch (error) {
        console.error('Error analyzing change with AI:', error);
        return {
            summary: 'Perubahan terdeteksi',
            significance: 'moderate',
            affectedTopics: []
        };
    }
}

/**
 * Generate ringkasan perubahan keseluruhan antara dua versi
 */
export async function generateVersionComparisonSummary(
    oldVersionTitle: string,
    newVersionTitle: string,
    changes: { articleNumber: string; changeType: string; }[]
): Promise<string> {
    try {
        const changesText = changes.map(c =>
            `- ${c.articleNumber}: ${c.changeType}`
        ).join('\n');

        const content = await callLLM([
            {
                role: 'system',
                content: 'Anda adalah asisten hukum Indonesia. Buat ringkasan perubahan peraturan dalam bahasa yang mudah dipahami masyarakat umum.'
            },
            {
                role: 'user',
                content: `Buat ringkasan perubahan dari "${oldVersionTitle}" ke "${newVersionTitle}":

${changesText}

Buat ringkasan dalam 2-3 paragraf.`
            }
        ], 500, 0.5);

        return content || 'Ringkasan tidak tersedia.';
    } catch (error) {
        console.error('Error generating summary:', error);
        return 'Ringkasan tidak tersedia.';
    }
}

/**
 * Test koneksi ke LLM
 */
export async function testLLMConnection(): Promise<{ success: boolean; model: string; error?: string }> {
    const baseUrl = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!baseUrl || !apiKey) return { success: false, model: '', error: 'OPENAI_BASE_URL and OPENAI_API_KEY must be configured' };

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Test connection. Reply with: OK' }],
                max_tokens: 10,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                model: MODEL,
                error: `${response.status} ${errorText}`
            };
        }

        const text = await response.text();
        let data: { model?: string; choices?: { message?: { content?: string } }[] };

        try {
            data = JSON.parse(text);
        } catch {
            const lastBrace = text.lastIndexOf('}');
            data = lastBrace > 0 ? JSON.parse(text.substring(0, lastBrace + 1)) : {};
        }

        return {
            success: true,
            model: data.model || MODEL
        };
    } catch (error) {
        return {
            success: false,
            model: MODEL,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
