# Phase 3 Research: Diff Engine Verification & Testing Pipeline

## Executive Summary: What to Know to Plan this Phase Well
To plan the automated testing pipeline for the `diff-engine.ts` component successfully, the following key points must be addressed:
1. **Lightweight Test Environment**: The `diff-engine.ts` component is a pure TypeScript utility. It does not depend on React DOM or Next.js server components. Therefore, we should configure the test environment to `'node'` in Vitest, which executes extremely fast and avoids the overhead of loading a browser environment.
2. **Implicit Dependency Resolution**: Using TypeScript path aliases (`@/*` mapping to `src/*`) in the codebase means Vitest must resolve these. Adding `vite-tsconfig-paths` is the cleanest way to synchronize Vitest with `tsconfig.json`.
3. **Tokenization Grain**: The engine works by tokenizing not just words but also whitespaces and punctuation. This means simple addition/deletion test cases will see increased token counts (e.g. appending a word also appends a whitespace token, resulting in `addedCount = 2`). Tests must be written to assert these exact counts to verify exact engine behavior.
4. **Execution Flow and Verification**: Once tests are configured and written, we must run a full validation check (`npm run test:run`), perform a production build (`npm run build`), verify using Docker Compose (`docker compose up --build`), and only then proceed to commit and push.

---

## 1. Vitest Installation & Packages
To set up Vitest in this Next.js TypeScript codebase, the following devDependencies are required:
- **`vitest`**: The core test runner.
- **`@vitejs/plugin-react`**: Standard Vite React plugin to enable future component and React Hook tests (compatible with React 19).
- **`vite-tsconfig-paths`**: A plugin that automatically resolves paths defined in `tsconfig.json` (such as `@/*`), avoiding redundant alias configuration.

**Installation Command:**
```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

---

## 2. Vitest Configuration (`vitest.config.ts`)
Create a new file `vitest.config.ts` in the root of the project to configure the environment and path aliases.

### Recommended Configuration (Using `vite-tsconfig-paths`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths()
    ],
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
});
```

### Alternative Configuration (Manual Path Resolution):
If you prefer not to install `vite-tsconfig-paths`, aliases can be mapped manually using Node's `path` module:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```
*Note: The plugin-based configuration is recommended to avoid desynchronization between TS path definitions in `tsconfig.json` and the test config.*

---

## 3. NPM Scripts
To integrate Vitest command utilities into the npm lifecycle, add the following to `package.json` under the `"scripts"` object:

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:watch": "vitest watch"
}
```

- **`npm run test`** (or `npm test`): Runs Vitest in its native interactive watch mode. Extremely useful for active development.
- **`npm run test:run`**: Executes all tests exactly once. This is the command that should be used in automated pipelines, CI environments, and pre-commit hooks.
- **`npm run test:watch`**: Explicit command to run in watch mode.

---

## 4. Unit Test Structure (`src/lib/diff-engine.test.ts`)
The test file should be placed adjacent to the source code at `src/lib/diff-engine.test.ts`. Here is the proposed test structure and scenarios to cover:

```typescript
import { describe, it, expect } from 'vitest';
import { compareTexts, getDiffSummary } from '@/lib/diff-engine';

describe('Diff Engine - compareTexts', () => {
    // A. Equal Parts / No Changes
    it('should return no changes when texts are identical', () => {
        const text = 'Undang-Undang Nomor 1 Tahun 2024';
        const result = compareTexts(text, text);
        
        expect(result.hasChanges).toBe(false);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([
            { type: 'equal', value: text }
        ]);
    });

    // B. Word Additions (Inserts)
    it('should detect word additions at the end of text', () => {
        const oldText = 'Saya makan';
        const newText = 'Saya makan nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.deletedCount).toBe(0);
        // Note: addedCount is 2 because the space ' ' and 'nasi' are separate tokens
        expect(result.addedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya makan' },
            { type: 'insert', value: ' nasi' }
        ]);
    });

    it('should detect word additions in the middle of text', () => {
        const oldText = 'Saya nasi';
        const newText = 'Saya makan nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.deletedCount).toBe(0);
        // 'makan ' (tokens: 'makan', ' ') is added
        expect(result.addedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya ' },
            { type: 'insert', value: 'makan ' },
            { type: 'equal', value: 'nasi' }
        ]);
    });

    // C. Word Deletions (Deletes)
    it('should detect word deletions at the end of text', () => {
        const oldText = 'Saya makan nasi';
        const newText = 'Saya makan';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(0);
        // ' nasi' (tokens: ' ', 'nasi') is deleted
        expect(result.deletedCount).toBe(2);
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya makan' },
            { type: 'delete', value: ' nasi' }
        ]);
    });

    // D. Mixed Changes (Replacements)
    it('should handle replacements (mixed additions and deletions) in the middle', () => {
        const oldText = 'Saya makan nasi';
        const newText = 'Saya minum nasi';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1); // 'minum'
        expect(result.deletedCount).toBe(1); // 'makan'
        expect(result.parts).toEqual([
            { type: 'equal', value: 'Saya ' },
            { type: 'delete', value: 'makan' },
            { type: 'insert', value: 'minum' },
            { type: 'equal', value: ' nasi' }
        ]);
    });

    // E. Empty Input Boundaries
    it('should handle comparison of two empty inputs', () => {
        const result = compareTexts('', '');
        
        expect(result.hasChanges).toBe(false);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([]);
    });

    it('should handle addition transition from empty to non-empty', () => {
        const result = compareTexts('', 'Undang-Undang');
        
        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1); // 'Undang-Undang' is parsed as a single token since hyphen isn't punctuation boundary
        expect(result.deletedCount).toBe(0);
        expect(result.parts).toEqual([
            { type: 'insert', value: 'Undang-Undang' }
        ]);
    });

    it('should handle deletion transition from non-empty to empty', () => {
        const result = compareTexts('Undang-Undang', '');
        
        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(0);
        expect(result.deletedCount).toBe(1);
        expect(result.parts).toEqual([
            { type: 'delete', value: 'Undang-Undang' }
        ]);
    });

    // F. Case Sensitivity Handling
    it('should treat case variations as combined delete and insert operations', () => {
        const oldText = 'Lembaga';
        const newText = 'lembaga';
        const result = compareTexts(oldText, newText);

        expect(result.hasChanges).toBe(true);
        expect(result.addedCount).toBe(1);
        expect(result.deletedCount).toBe(1);
        expect(result.parts).toEqual([
            { type: 'delete', value: 'Lembaga' },
            { type: 'insert', value: 'lembaga' }
        ]);
    });
});

describe('Diff Engine - getDiffSummary', () => {
    it('should return "Tidak ada perubahan" when there are no differences', () => {
        const summary = getDiffSummary('Presiden menetapkan', 'Presiden menetapkan');
        expect(summary).toBe('Tidak ada perubahan');
    });

    it('should return additions summary only', () => {
        const summary = getDiffSummary('Presiden menetapkan', 'Presiden menetapkan peraturan');
        expect(summary).toBe('+2 kata ditambahkan'); // space + 'peraturan'
    });

    it('should return deletions summary only', () => {
        const summary = getDiffSummary('Presiden menetapkan peraturan', 'Presiden menetapkan');
        expect(summary).toBe('-2 kata dihapus'); // space + 'peraturan'
    });

    it('should return combined summary for replacements', () => {
        const summary = getDiffSummary('Presiden menetapkan peraturan', 'Presiden mengubah peraturan');
        expect(summary).toBe('+1 kata ditambahkan, -1 kata dihapus');
    });
});
```

---

## 5. Codebase Mapping & Current Status
Based on grep searches and directory inspection:
1. **Runner Configuration**: There is currently no active test runner (no Vitest, Jest, Cypress, or Playwright configuration is found in the project root).
2. **Dependencies**: `package.json` has zero devDependencies relating to testing framework packages.
3. **Existing Files**: No `*.test.*` or `*.spec.*` files exist.
4. **Diagnostic Assets**: The app contains diagnostic API routes to verify integrations manually. The proposed automated unit testing will be the first of its kind in the codebase.
5. **Code Convention Alignment**: The recommended test file structure fits the project's collocation preferences.

---

## 6. Proposed Implementation Plan & File Diff Summary
### Action Steps:
1. **Install Dependencies**: Execute `npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths`.
2. **Add Configuration**: Create `vitest.config.ts` in the root of the project workspace.
3. **Register Scripts**: Update `package.json` `"scripts"` with `"test"`, `"test:run"`, and `"test:watch"`.
4. **Write Test Suite**: Create `src/lib/diff-engine.test.ts` with the provided unit test suite.
5. **Verify**: Run `npm run test:run` locally to confirm all tests pass.
6. **Build & Build Container**: Ensure `npm run build` succeeds, then run `docker compose up --build` to verify container building before final commit.
