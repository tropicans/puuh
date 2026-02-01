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
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1';
    const apiKey = process.env.OPENAI_API_KEY || '';

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

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
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
4. Jika teks adalah "Perubahan", hanya ekstrak pasal yang disebutkan berubah/ditambah.
5. Abaikan header/footer halaman.`
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

            // Validation: IF AI returns very few articles but text is long, suspect truncation
            if (rawText.length > 5000 && aiArticles.length < 3) {
                console.log('AI parsed too few articles, falling back to regex');
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
    // Improved regex to catch "Pasal 1", "Pasal 2", "Pasal 6A", "Pasal 103A"
    const parts = normalizedText.split(/\n(?=Pasal\s+\d+[A-Z]*)/i);

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
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://proxy.kelazz.my.id/v1';
    const apiKey = process.env.OPENAI_API_KEY || '';

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

        const data = await response.json();

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
