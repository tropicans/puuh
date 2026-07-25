# Coding Conventions

**Analysis Date:** 2026-07-25

## Naming Patterns

**Files:**
- PascalCase for React component files (`RegulationList.tsx`, `VersionTimeline.tsx`).
- kebab-case for server action and utility files (`regulations.ts`, `diff-engine.ts`, `ai-service.ts`).
- Standard Next.js framework files in lowercase (`page.tsx`, `layout.tsx`, `route.ts`).
- Test files suffix matches standard test configuration (`*.test.ts`, `*.test.tsx`).

**Functions:**
- camelCase for all variable and function names (`smartExtractPdfText`, `compareTexts`).
- Event handlers typically prefixed with `handle` (`handleUpload`, `handleSubmit`).
- No specific prefixes for asynchronous functions (returning `Promise<T>`).

**Variables:**
- camelCase for variable names (`rawText`, `fileSizeMB`).
- UPPER_SNAKE_CASE for global constants (`MODEL`, `VISION_MODEL`, `MINIO_PORT`, `MAX_SIZE_MB`).

**Types:**
- PascalCase for interfaces, type definitions, and classes.
- No `I` prefix prefixing interface names (`ParsedArticle`, `ActionResult<T>`).
- Prisma schema enum values must be uppercase (`VersionStatus.ACTIVE`, `Role.ADMIN`, `ChangeType.ADDED`).

## Code Style

**Formatting:**
- Semicolons: **Required** at the end of statements.
- Quotes: **Single quotes** for string literals in Javascript/TypeScript (`'use server'`, `'application/pdf'`). Double quotes are allowed in JSX attributes.
- Indentation: **4 spaces** for indentation.
- Width: Keep lines under 120 characters where possible.

**Linting:**
- ESLint v9 configured via `eslint.config.mjs`.
- Run checks: `npm run lint`.
- Strict typing enabled (`tsconfig.json` runs with `"strict": true`). Avoid using `any` type definitions. Use unions, generics, or `unknown` + narrowing instead.

## Import Organization

**Order:**
1. External npm packages (e.g. `react`, `next`, `openai`).
2. Internal alias imports using `@/` mapping (`@/lib/prisma`, `@/components/comparison`).
3. Relative imports pointing to directory sibling files (`./utils`, `../types`).
4. Type-only imports (`import type { User }`).

**Grouping:**
- Keep a single blank line separating each group of imports.
- Maintain alphabetical order within each import group.

**Path Aliases:**
- Prefer absolute path alias `@/` mapping to `src/` for all imports. Do not use relative imports traversing up more than 2 directories.

## Error Handling

**Patterns:**
- Return a structured result implementing `ActionResult<T>` in Server Actions to prevent uncaught exceptions from throwing white screens:
  `{ success: boolean; data?: T; error?: string }`
- Wrap all database operations, network API requests, and third-party interactions in `try/catch` blocks.
- Log error context with `console.error` before returning a user-friendly message.
- API route handlers must return `NextResponse.json` with correct HTTP status codes (401 Unauthorized, 403 Forbidden, 413 Payload Too Large, 500 Internal Error).
- Tolerant fallbacks: If MinIO or AI structural extraction fails, log the exception and proceed with text-based fallback parses without crashing.

## Logging

**Framework:**
- Native console outputs (`console.log`, `console.error`).
- Structured logging details in CLI outputs.
- Never log database connection URLs, tokens, passwords, or raw file contents in standard logs.

## Comments

**When to Comment:**
- Use double-slash `//` comments to explain *why* code was written in a certain way, or to highlight temporary workarounds/fallbacks.
- Keep comments concise and avoid obvious statements.
- Document public components and complex functions using JSDoc/TSDoc blocks explaining arguments and return types.
- TODO format: `// TODO: description` (no username, tracking changes using git blame).

## Function Design

**Size:**
- Keep functions short, single-purpose, and composable.
- Extract helper sub-functions if logic exceeds 50 lines.

**Parameters:**
- Limit functions to 3 parameters. For more parameters, use destructured configuration objects instead.

**Return Values:**
- Use early return patterns with guard clauses to minimize indentation nesting.
- Ensure all function execution paths return explicit values.

---

*Convention analysis: 2026-07-25*
*Update when patterns change*
