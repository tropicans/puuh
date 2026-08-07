# Coding Conventions

**Analysis Date:** 2026-08-07

## Naming Patterns

**Files:**
- kebab-case for modules, services, routers, and helper scripts (e.g., `pdf-service.ts`, `auth-middleware.ts`).
- PascalCase for React component files (e.g., `RegulationList.tsx`, `VersionTimeline.tsx`).
- kebab-case for Next.js folder routes.
- *.test.ts for unit test files.

**Functions:**
- camelCase for all functions (e.g., `fetchFromBackend`, `parseArticlesFromText`).
- No special prefix for async functions.
- handleEventName for event handlers in React (e.g., `handleUploadSuccess`, `handleLoginSubmit`).

**Variables:**
- camelCase for variables (e.g., `extractedText`, `userId`).
- UPPER_SNAKE_CASE for constants (e.g., `DATABASE_URL`, `DOCLING_API_URL`).
- No underscore prefix for private methods or members.

**Types:**
- PascalCase for interfaces and type definitions (e.g., `Regulation`, `ArticleChange`). No "I" prefix.
- UPPER_CASE for Prisma enum values in code (e.g., `ACTIVE`, `AMENDED`, `REVOKED`).

## Code Style

**Formatting:**
- There is no Prettier config committed; follow file-local conventions.
- Indentation: 2 spaces.
- Semicolons: mixed styles present. Business files often use semicolons. shadcn component files omit semicolons.
- Quotes: single quotes for application files, double quotes for shadcn files.

**Linting:**
- ESLint configured.
- Member rules: `strict: true` in `tsconfig.json`.
- Run: `npm run lint`.

## Import Organization

**Order:**
1. External packages (react, express, dotenv, etc.).
2. Internal alias modules (using `@/` for frontend imports, or `@backend/` mappings).
3. Relative imports (./, ../).
4. Type imports (`import type {}`).

**Grouping:**
- Blank line between import groups.
- Sorted alphabetically inside groups.

## Error Handling

**Patterns:**
- Wrap async DB, filesystem, and external network logic in standard `try/catch` blocks.
- Logging context: `console.error("message", error)` with detailed info.
- Backend routing handlers return standard JSON error structures with correct HTTP statuses (e.g. 400 for bad request, 401 for unauthorized, 500 for server crash).
- Frontend Server Actions capture backend HTTP error codes and return predictable, safe user-facing error messages in the format `{ success: false, error: string }`.

## Logging

**Framework:**
- Console logger formatted in `backend/src/utils/logger.ts`.
- Debugging logs in stdout.
- No raw token logging or database URL logging.

## Comments

**When to Comment:**
- Explain the logic's "why" rather than "what".
- Describe legal rules mapping or heuristics context (e.g. why fallback OCR vision model is selected).
- TODO comments format: `// TODO: description` linked to issues where possible.

---

*Convention analysis: 2026-08-07*
*Update when patterns change*
