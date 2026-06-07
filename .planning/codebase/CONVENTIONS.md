# Coding Conventions

**Analysis Date:** 2026-06-07

## Naming Patterns

**Files:**
- PascalCase for React component files (e.g., `RegulationList.tsx`, `VersionTimeline.tsx`).
- kebab-case for services, utility libraries, and server action files (e.g., `ai-service.ts`, `diff-engine.ts`, `regulations.ts`).
- Standard Next.js files: `page.tsx`, `layout.tsx`, `route.ts`.

**Functions:**
- camelCase for all function names (e.g., `smartExtractPdfText`, `getCurrentUser`, `compareTexts`).
- No specific prefix for async functions (they return `Promise<T>`).
- Event handlers typically prefixed with `handle` (e.g., `handleUpload`, `handleSubmit`).

**Variables:**
- camelCase for variables (e.g., `rawText`, `fileSizeMB`, `parsedArticles`).
- UPPER_SNAKE_CASE for global configuration constants (e.g., `MODEL`, `VISION_MODEL`, `MINIO_PORT`, `MAX_SIZE_MB`).

**Types & Interfaces:**
- PascalCase for type aliases, interfaces, and classes.
- No `I` prefix for interfaces (e.g., `ParsedArticle`, `ActionResult<T>`, `CurrentUser`).
- Prisma enums are UPPERCASE (e.g., `VersionStatus.ACTIVE`, `Role.ADMIN`, `ChangeType.ADDED`).

## Code Style

**Formatting:**
- Semicolons: **Required** at the end of statements.
- Quotes: **Single quotes** for string literals in code (`'use server'`, `'application/pdf'`). Double quotes are acceptable in JSX attributes.
- Indentation: **4 spaces** for indentation.
- Cleanliness: Keep lines under 120 characters where possible.

**Linting:**
- Linter: ESLint v9 (`eslint.config.mjs` config).
- Run check: `npm run lint`.
- Strict typing enabled (`tsconfig.json` runs with `"strict": true`). Avoid utilizing `any` where possible.

## Import Organization

**Order:**
1. External npm packages (e.g., `import NextAuth from "next-auth"`, `import { z } from "zod"`).
2. Internal alias imports starting with `@/` (e.g., `import prisma from '@/lib/prisma'`, `import { uploadSchema } from '@/lib/validations'`).
3. Relative imports starting with `./` or `../` (e.g., `import { cleanPdfText } from './utils'`).

**Path Aliases:**
- Use `@/*` mapping to `src/*` for all absolute imports. Do not write relative imports going up more than 2 levels (use path alias instead).

## Error Handling

**Server Actions:**
- Must return a standard structured object implementing `ActionResult<T>` to avoid uncaught server-side exceptions crashing the UI:
  ```typescript
  interface ActionResult<T> {
      success: boolean;
      data?: T;
      error?: string;
  }
  ```
- Wrap database, storage, and API operations in `try/catch` blocks.
- Log error context using `console.error` before returning a user-friendly message:
  ```typescript
  try {
      // business logic
  } catch (error) {
      console.error('Error in actionName:', error);
      return { success: false, error: 'User-friendly error message' };
  }
  ```

**API Route Handlers:**
- Return `NextResponse.json` with appropriate HTTP status codes (e.g., 401 for Unauthorized, 403 for Forbidden, 429 for Rate Limit, 413 for Payload Too Large, 500 for Internal Server Error).

**Graceful Degradation:**
- Build robust fallbacks for external service failures. If an LLM-based operation fails, fall back to Regex parsing (`ai-service.ts`) or log a warning and continue without breaking the entire process chain (e.g., MinIO upload failure).

## Logging

- Use standard `console.log` for informational execution steps (e.g., `console.log('PDF loaded: 12 pages')`).
- Use `console.error` for errors and warnings.
- Keep logs concise. Never log full database credentials, access tokens, API keys, or raw file contents.

## Comments

- Use double-slash `//` comments to explain *why* code was written in a certain way, or to highlight temporary workarounds/fallbacks.
- Document complex functions using JSDoc/TSDoc notation (`/** ... */`) describing parameters, return values, and behavior.

---

*Convention analysis: 2026-06-07*
*Update when patterns change*
