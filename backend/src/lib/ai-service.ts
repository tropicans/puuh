// AI Service untuk parsing dan analisis peraturan
import config from '../config/index';
import { inferOutcomeFromAmar, buildImpactsFromAmar } from './judicial-review';

const MODEL = config.OPENAI_MODEL;

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
async function callLLM(
    messages: { role: string; content: string }[],
    maxTokens: number = 4000,
    temperature: number = 0.1,
    responseFormat?: any
): Promise<string> {
    const baseUrl = process.env.OPENAI_BASE_URL || config.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY || config.OPENAI_API_KEY;
    if (!baseUrl || !apiKey) throw new Error('OPENAI_BASE_URL and OPENAI_API_KEY must be configured');

    const requestBody: any = {
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
    };

    if (responseFormat) {
        requestBody.response_format = responseFormat;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
 * Memecah teks peraturan menjadi beberapa chunk berdasarkan batas logis (seperti Pasal atau BAB)
 * agar tidak memotong suatu pasal di tengah jalan.
 */
export function splitTextIntoChunks(text: string, maxChunkSize = 15000): string[] {
    const chunks: string[] = [];
    const boundaryRegex = /(?:^|\n)\s*(Pasal\s+\d+|BAB\s+[IVXLCDM\d]+|Bab\s+[IVXLCDM\d]+)/gi;
    
    const boundaries: number[] = [0]; // Selalu mulai dari 0
    let match;
    while ((match = boundaryRegex.exec(text)) !== null) {
        if (match.index > 0) {
            boundaries.push(match.index);
        }
    }
    boundaries.push(text.length); // Batas akhir
    
    let currentChunkStart = 0;
    for (let i = 1; i < boundaries.length; i++) {
        const nextBoundary = boundaries[i];
        const currentLength = nextBoundary - currentChunkStart;
        
        if (currentLength > maxChunkSize) {
            const previousBoundary = boundaries[i - 1];
            if (previousBoundary > currentChunkStart) {
                chunks.push(text.substring(currentChunkStart, previousBoundary).trim());
                currentChunkStart = previousBoundary;
                i--; // evaluasi kembali segmen saat ini
            } else {
                // Segmen tunggal lebih besar dari maxChunkSize, potong berdasarkan limit karakter
                let splitIndex = currentChunkStart + maxChunkSize;
                const lastNewline = text.lastIndexOf('\n', splitIndex);
                if (lastNewline > currentChunkStart) {
                    splitIndex = lastNewline;
                }
                chunks.push(text.substring(currentChunkStart, splitIndex).trim());
                currentChunkStart = splitIndex;
                i--; // evaluasi kembali sisa segmen ini
            }
        }
    }
    
    if (currentChunkStart < text.length) {
        chunks.push(text.substring(currentChunkStart).trim());
    }
    
    return chunks.filter(c => c.length > 0);
}

/**
 * Ekstraksi pasal untuk satu chunk teks menggunakan Structured Outputs JSON Schema
 */
async function parseArticlesSingleChunk(chunkText: string): Promise<ParsedArticle[]> {
    const responseSchema = {
        type: 'json_schema',
        json_schema: {
            name: 'regulation_articles',
            strict: true,
            schema: {
                type: 'object',
                properties: {
                    articles: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                number: { type: 'string' },
                                content: { type: 'string' }
                            },
                            required: ['number', 'content'],
                            additionalProperties: false
                        }
                    }
                },
                required: ['articles'],
                additionalProperties: false
            }
        }
    };

    try {
        const content = await callLLM([
            {
                role: 'system',
                content: `Anda adalah asisten hukum Indonesia yang ahli dalam mengekstrak pasal peraturan.
Tugas Anda menjabarkan SEMUA pasal dari teks yang diberikan.

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
                content: `Ekstrak semua pasal dari teks berikut:\n\n${chunkText}`
            }
        ], 12000, 0, responseSchema);

        let articlesObj: any = null;
        try {
            articlesObj = JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    articlesObj = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error('Failed to parse regex-matched JSON object:', e);
                }
            }
        }

        if (articlesObj && Array.isArray(articlesObj.articles)) {
            const aiArticles = articlesObj.articles as ParsedArticle[];

            // Heuristic validation
            const originalPasalCount = (chunkText.match(/\bPasal\s+\d+/gi) || []).length;
            const isSignificantDiscrepancy = originalPasalCount >= 3 && (
                aiArticles.length < originalPasalCount * 0.6 ||
                (originalPasalCount - aiArticles.length) > 3
            );

            if ((chunkText.length > 5000 && aiArticles.length < 2) || isSignificantDiscrepancy) {
                console.log(`AI parsed too few articles in chunk (${aiArticles.length} parsed vs. ${originalPasalCount} occurrences in text), falling back to regex`);
                return parseArticlesWithRegex(chunkText);
            }

            return aiArticles;
        }

        console.log('AI failed to produce valid articles JSON structure, falling back to regex');
        return parseArticlesWithRegex(chunkText);
    } catch (error) {
        console.error('Error parsing chunk with AI:', error);
        return parseArticlesWithRegex(chunkText);
    }
}

/**
 * Parse raw text dari PDF untuk mengekstrak pasal-pasal
 * Handles large texts by processing in chunks hierarchically
 */
export async function parseArticlesFromText(rawText: string): Promise<ParsedArticle[]> {
    if (rawText.length > 20000) {
        console.log(`Processing large text (${rawText.length} chars) in chunks`);
        const chunks = splitTextIntoChunks(rawText);
        console.log(`Split text into ${chunks.length} chunks`);

        const allArticles: ParsedArticle[] = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
            const chunkArticles = await parseArticlesSingleChunk(chunk);
            allArticles.push(...chunkArticles);
        }

        // Merge duplicate article numbers by appending contents (matching versions.ts logic)
        const uniqueArticlesMap = new Map<string, string>();
        for (const article of allArticles) {
            const key = article.number.trim();
            if (!key) continue;
            if (uniqueArticlesMap.has(key)) {
                const existingContent = uniqueArticlesMap.get(key)!;
                if (!existingContent.includes(article.content)) {
                    uniqueArticlesMap.set(key, existingContent + '\n\n' + article.content);
                }
            } else {
                uniqueArticlesMap.set(key, article.content);
            }
        }

        return Array.from(uniqueArticlesMap.entries()).map(([number, content]) => ({ number, content }));
    } else {
        return parseArticlesSingleChunk(rawText);
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
    const baseUrl = config.OPENAI_BASE_URL;
    const apiKey = config.OPENAI_API_KEY;
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

export interface JRAnalysisResult {
    outcome: 'GRANTED' | 'PARTIALLY_GRANTED' | 'REJECTED' | 'INADMISSIBLE' | 'WITHDRAWN' | 'OTHER';
    impacts: {
        articleNumber: string;
        disposition: 'INVALIDATED' | 'UPHELD' | 'CONDITIONALLY_VALID' | 'CONDITIONALLY_INVALID' | 'NO_DIRECT_EFFECT';
        notes: string;
        amarExcerpt: string;
    }[];
}

/**
 * Menganalisis teks Amar Putusan MK/MA menggunakan OpenAI Structured Outputs
 * untuk mendeteksi outcome putusan dan pasal-pasal yang terdampak secara presisi.
 */
export async function analyzeJudicialReviewAmar(
    amarText: string,
    articleList: string[]
): Promise<JRAnalysisResult> {
    const responseSchema = {
        type: 'json_schema',
        json_schema: {
            name: 'judicial_review_analysis',
            strict: true,
            schema: {
                type: 'object',
                properties: {
                    outcome: {
                        type: 'string',
                        enum: ['GRANTED', 'PARTIALLY_GRANTED', 'REJECTED', 'INADMISSIBLE', 'WITHDRAWN', 'OTHER']
                    },
                    impacts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                articleNumber: { type: 'string' },
                                disposition: {
                                    type: 'string',
                                    enum: ['INVALIDATED', 'UPHELD', 'CONDITIONALLY_VALID', 'CONDITIONALLY_INVALID', 'NO_DIRECT_EFFECT']
                                },
                                notes: { type: 'string' },
                                amarExcerpt: { type: 'string' }
                            },
                            required: ['articleNumber', 'disposition', 'notes', 'amarExcerpt'],
                            additionalProperties: false
                        }
                    }
                },
                required: ['outcome', 'impacts'],
                additionalProperties: false
            }
        }
    };

    const prompt = `Anda adalah asisten hukum Indonesia yang ahli dalam menganalisis putusan Judicial Review (Mahkamah Konstitusi/Mahkamah Agung).
Tugas Anda adalah membaca teks "Amar Putusan" berikut, menentukan "Outcome" putusan secara keseluruhan, serta memetakan dampak putusan terhadap pasal-pasal tertentu.

Berikut daftar pasal yang ada dalam peraturan terkait:
${articleList.map(a => `- ${a}`).join('\n')}

Aturan Analisis:
1. **Outcome Putusan**:
   - GRANTED (Kabul): Jika permohonan dikabulkan untuk seluruhnya.
   - PARTIALLY_GRANTED (Kabul Sebagian): Jika permohonan dikabulkan sebagian.
   - REJECTED (Tolak): Jika permohonan ditolak seluruhnya.
   - INADMISSIBLE (Tidak dapat diterima): Jika permohonan dinyatakan tidak dapat diterima (N.O.).
   - WITHDRAWN (Ditarik): Jika pemohon menarik kembali permohonannya.
   - OTHER: Status lain jika tidak masuk kategori di atas.

2. **Dampak (Impacts) per Pasal**:
   Hanya cantumkan pasal yang disebutkan langsung dalam amar putusan yang terpengaruh/diuji.
   Untuk setiap pasal terdampak, tentukan disposisinya:
   - INVALIDATED: Pasal dinyatakan bertentangan dengan UUD/peraturan lebih tinggi dan tidak mempunyai kekuatan hukum mengikat (batal/dihapus/tidak berlaku).
   - UPHELD: Pasal dinyatakan tidak bertentangan dan tetap berlaku (biasanya jika outcome adalah REJECTED/INADMISSIBLE).
   - CONDITIONALLY_VALID: Pasal dinyatakan konstitusional bersyarat (berlaku sepanjang ditafsirkan sesuai amar putusan).
   - CONDITIONALLY_INVALID: Pasal dinyatakan inkonstitusional bersyarat (tidak berlaku sepanjang tidak ditafsirkan sesuai amar putusan).
   - NO_DIRECT_EFFECT: Diuji atau disebut, tapi tidak ada perubahan status keberlakuan langsung.

3. **Field Pendukung**:
   - 'notes': Penjelasan ringkas mengapa pasal tersebut mendapat disposisi tersebut berdasarkan isi amar.
   - 'amarExcerpt': Kutipan kalimat/klausa verbatim dari teks amar yang secara spesifik membahas pasal tersebut (maksimal 2-3 kalimat).

Amar Putusan:
"""
${amarText}
"""`;

    try {
        const content = await callLLM([
            { role: 'system', content: 'Anda adalah ahli hukum tata negara Indonesia.' },
            { role: 'user', content: prompt }
        ], 3000, 0, responseSchema);

        const parsed = JSON.parse(content);
        return parsed as JRAnalysisResult;
    } catch (error) {
        console.error('Error analyzing judicial review with LLM:', error);
        // Fallback to heuristic parsing if LLM fails
        const outcome = inferOutcomeFromAmar(amarText);
        const heuristicImpacts = buildImpactsFromAmar(amarText, outcome);
        return {
            outcome,
            impacts: heuristicImpacts.map(imp => ({
                articleNumber: imp.articleNumber,
                disposition: imp.disposition,
                notes: 'Parsed using heuristics fallback due to AI failure.',
                amarExcerpt: imp.amarExcerpt || ''
            }))
        };
    }
}
