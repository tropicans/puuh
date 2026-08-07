import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArticlesFromText } from './ai-service';

describe('parseArticlesFromText with AI heuristic validation', () => {
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

    it('should parse articles successfully when LLM output is correct', async () => {
        const rawText = 'Pasal 1\nTentang ketentuan umum.\nPasal 2\nTentang ketentuan khusus.';
        const mockResponse = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify([
                        { number: 'Pasal 1', content: 'Tentang ketentuan umum.' },
                        { number: 'Pasal 2', content: 'Tentang ketentuan khusus.' }
                    ])
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
    });

    it('should fallback to regex parsing when LLM output has significant discrepancy (heuristic)', async () => {
        // Text has 5 "Pasal" occurrences
        const rawText = 'Pasal 1\nIsi pasal satu.\nPasal 2\nIsi pasal dua.\nPasal 3\nIsi pasal tiga.\nPasal 4\nIsi pasal empat.\nPasal 5\nIsi pasal lima.';
        
        // LLM only returns 1 article (under-parsed)
        const mockResponse = JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify([
                        { number: 'Pasal 1', content: 'Isi pasal satu.' }
                    ])
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
