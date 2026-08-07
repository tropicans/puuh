import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArticlesFromText, splitTextIntoChunks } from './ai-service';

describe('splitTextIntoChunks', () => {
    it('should split text at logical article boundaries', () => {
        const text = 'Preamble text\nPasal 1\nContent of article 1\nPasal 2\nContent of article 2\nBAB II\nPasal 3\nContent of article 3';
        // Split with very small chunk size to force splitting
        const chunks = splitTextIntoChunks(text, 30);
        
        expect(chunks.length).toBeGreaterThanOrEqual(3);
        // Each chunk should start/split nicely
        expect(chunks[0]).toContain('Preamble text');
        expect(chunks[2]).toContain('Pasal 2');
        expect(chunks[3]).toContain('BAB II');
    });

    it('should split large segments by newline when no boundary exists', () => {
        const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6';
        const chunks = splitTextIntoChunks(text, 15);
        expect(chunks.length).toBeGreaterThan(1);
    });
});

describe('parseArticlesFromText with Structured Outputs and Chunking', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.OPENAI_BASE_URL = 'https://mock.openai.v1';
        process.env.OPENAI_API_KEY = 'mock-api-key';
        fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    it('should parse articles successfully when LLM output is correct in structured format', async () => {
        const rawText = 'Pasal 1\nTentang ketentuan umum.\nPasal 2\nTentang ketentuan khusus.';
        const mockResponse = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 1', content: 'Tentang ketentuan umum.' },
                            { number: 'Pasal 2', content: 'Tentang ketentuan khusus.' }
                        ]
                    })
                }
            }]
        });

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse
        } as Response);

        const result = await parseArticlesFromText(rawText);
        expect(result).toHaveLength(2);
        expect(result[0].number).toBe('Pasal 1');
        expect(result[1].number).toBe('Pasal 2');
        
        // Verify response_format JSON schema was sent in fetch body
        const callArgs = fetchSpy.mock.calls[0];
        const body = JSON.parse(callArgs[1]?.body as string);
        expect(body.response_format?.type).toBe('json_schema');
        expect(body.response_format?.json_schema?.name).toBe('regulation_articles');
    });

    it('should split large text (>20000 chars) into chunks and parse sequentially', async () => {
        // Create a large text string (> 20000 characters)
        let largeText = 'Preamble text\n';
        for (let i = 1; i <= 25; i++) {
            largeText += `Pasal ${i}\nContent of article ${i} which repeats to make text longer. `.repeat(15) + '\n';
        }
        
        expect(largeText.length).toBeGreaterThan(20000);

        // Mock LLM response for each chunk
        const mockResponse1 = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 1', content: 'Content of article 1' },
                            { number: 'Pasal 2', content: 'Content of article 2' }
                        ]
                    })
                }
            }]
        });

        const mockResponse2 = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 3', content: 'Content of article 3' },
                            { number: 'Pasal 4', content: 'Content of article 4' }
                        ]
                    })
                }
            }]
        });

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse1
        } as Response);

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse2
        } as Response);

        // Call parseArticlesFromText, which will chunk and call fetch multiple times
        const result = await parseArticlesFromText(largeText);
        
        expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(result.length).toBeGreaterThanOrEqual(4);
        expect(result.map(r => r.number)).toContain('Pasal 1');
        expect(result.map(r => r.number)).toContain('Pasal 3');
    });

    it('should merge duplicate articles across chunks by appending content', async () => {
        // Large text to trigger chunking (> 20000 characters)
        let largeText = 'Preamble\n';
        largeText += `Pasal 1\n${'content '.repeat(700)}\n`;
        largeText += `Pasal 2\n${'content '.repeat(700)}\n`;
        largeText += `Pasal 1\n${'content '.repeat(700)}\n`;
        largeText += `Pasal 2\n${'content '.repeat(700)}\n`;

        const mockResponse1 = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 1', content: 'Part A of Pasal 1' },
                            { number: 'Pasal 2', content: 'Part A of Pasal 2' }
                        ]
                    })
                }
            }]
        });

        const mockResponse2 = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 1', content: 'Part B of Pasal 1' },
                            { number: 'Pasal 2', content: 'Part B of Pasal 2' }
                        ]
                    })
                }
            }]
        });

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse1
        } as Response);

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse2
        } as Response);

        const result = await parseArticlesFromText(largeText);
        expect(fetchSpy.mock.calls.length).toBe(2);
        
        const pasal1 = result.find(r => r.number === 'Pasal 1');
        expect(pasal1).toBeDefined();
        expect(pasal1?.content).toContain('Part A of Pasal 1');
        expect(pasal1?.content).toContain('Part B of Pasal 1');

        const pasal2 = result.find(r => r.number === 'Pasal 2');
        expect(pasal2).toBeDefined();
        expect(pasal2?.content).toContain('Part A of Pasal 2');
        expect(pasal2?.content).toContain('Part B of Pasal 2');
    });

    it('should fallback to regex parsing when LLM output has significant discrepancy', async () => {
        // Text has 5 "Pasal" occurrences
        const rawText = 'Pasal 1\nIsi pasal satu.\nPasal 2\nIsi pasal dua.\nPasal 3\nIsi pasal tiga.\nPasal 4\nIsi pasal empat.\nPasal 5\nIsi pasal lima.';
        
        // LLM only returns 1 article (under-parsed)
        const mockResponse = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        articles: [
                            { number: 'Pasal 1', content: 'Isi pasal satu.' }
                        ]
                    })
                }
            }]
        });

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse
        } as Response);

        const result = await parseArticlesFromText(rawText);
        // Fallback to regex should parse all 5 articles
        expect(result.length).toBeGreaterThanOrEqual(5);
        expect(result[0].number).toBe('Pasal 1');
        expect(result[4].number).toBe('Pasal 5');
    });

    it('should fallback to regex when LLM returns invalid JSON', async () => {
        const rawText = 'Pasal 1\nIsi pasal satu.\nPasal 2\nIsi pasal dua.';
        const mockResponse = JSON.stringify({
            choices: [{
                message: {
                    content: 'This is not JSON!'
                }
            }]
        });

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            text: async () => mockResponse
        } as Response);

        const result = await parseArticlesFromText(rawText);
        expect(result).toHaveLength(2);
        expect(result[0].number).toBe('Pasal 1');
    });
});
