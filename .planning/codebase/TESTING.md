# Testing Patterns

**Analysis Date:** 2026-07-25

## Test Framework

**Runner:**
- Vitest ^4.1.8
- Config: `vitest.config.ts` in the project root

**Assertion Library:**
- Vitest built-in `expect` assertions
- Matchers: `toBe`, `toEqual`, `toThrow`, `toBeLessThanOrEqual`, `toContain`, `toHaveBeenCalledWith`

**Run Commands:**
```bash
npm run test                          # Run all tests in interactive mode
npm run test:run                      # Run all tests once
npm run test:watch                    # Run tests in watch mode
npx vitest path/to/file.test.ts       # Run a single test file
```

## Test File Organization

**Location:**
- Test files are colocated directly alongside their corresponding source files inside `src/`.
- No separate external `tests/` directory is used.

**Naming:**
- Suffix `*.test.ts` for all test suites (`src/lib/diff-engine.test.ts`, `src/lib/ocr-service.test.ts`).

**Structure:**
```
src/
  lib/
    diff-engine.ts
    diff-engine.test.ts
    ocr-service.ts
    ocr-service.test.ts
```

## Test Structure

**Suite Organization:**
Test suites are grouped using standard `describe` blocks. Individual specifications use `it` blocks.
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { someFunction } from './some-module';

describe('someModule - someFunction', () => {
    beforeEach(() => {
        // Arrange / Setup per test
    });

    afterEach(() => {
        // Cleanup / Teardown per test
    });

    it('should behave correctly under conditions', async () => {
        // Act
        const result = await someFunction();
        
        // Assert
        expect(result).toBe(expected);
    });
});
```

**Patterns:**
- Use `beforeEach` to clear mock call histories (`vi.clearAllMocks()`) or setup test spies.
- Use `afterEach` to restore mocked objects/globals (`mockSpy.mockRestore()`).
- Keep tests simple and focused on testing single logical behaviors.

## Mocking

**Framework:**
- Vitest built-in mock utility (`vi`).
- Module mocking via `vi.mock` at the top of test files (e.g. mocking `pdf-lib` module).
- Global API stubbing via `vi.stubGlobal` (e.g. stubbing `fetch` to mock REST API integration responses).
- Spy mocking using `vi.spyOn` (e.g. overriding `setTimeout` timer speeds during retry checks).

**Patterns:**
```typescript
// Mocking modules
vi.mock('pdf-lib', () => {
    return {
        PDFDocument: {
            load: vi.fn(),
            create: vi.fn()
        }
    };
});

// Mocking globals
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Configure mock returns in tests
it('returns mocked response', async () => {
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Text' } }] })
    });
});
```

**What to Mock:**
- External REST APIs (Pasal.id, custom LLM proxy, Google Vision).
- Heavy CPU/IO page libraries (`pdf-lib`, `pdfjs-dist`).
- Timing functions (`setTimeout`) to run retry delays instantly.

**What NOT to Mock:**
- Pure functions, LCS string comparisons, and mathematical helper utilities.

## Fixtures and Factories

**Test Data:**
- Simple test data is created inline (e.g., small strings like `'Saya makan nasi'`).
- Simulated buffers (using `Buffer.alloc` or `Buffer.from`) are generated dynamically in tests.

## Coverage

**Requirements:**
- No rigid test coverage thresholds currently set.
- Focus is on validating critical logical services (`diff-engine.ts`, `ocr-service.ts`).

## Test Types

**Unit Tests:**
- Test isolated, side-effect-free algorithms.
- Example: `diff-engine.test.ts` checking text difference highlighting.

**Integration Tests:**
- Test orchestration pipelines with mocked external API requests.
- Example: `ocr-service.test.ts` validating concurrent processing limits, resilient fallback strategies, page-splitting limits, and exponential backoff retry counts.

---

*Testing analysis: 2026-07-25*
*Update when test patterns change*
