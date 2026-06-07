<!-- GSD:project-start source:PROJECT.md -->

## Project

**PUU Tracker**

PUU Tracker is a Next.js full-stack application designed to track, store, and analyze Indonesian legislation (Peraturan Perundang-Undangan). It processes legal PDF files, extracts verbatim text using standard libraries (falling back to LLM Vision OCR for scanned pages), and calculates word-by-word diffs between legislation versions using a custom Longest Common Subsequence (LCS) engine.

**Core Value:** Enable users to trace and visualize verbatim changes in articles across different versions of Indonesian legislation.

### Constraints

- **Tech Stack**: Must use React 19, Next.js (App Router), Tailwind CSS v4, Prisma, PostgreSQL, and MinIO storage.
- **Portability**: All file storage paths and API endpoints must remain compatible with the custom proxy.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.x - All application code and server actions
- JavaScript (ES Modules) - Configuration files (`eslint.config.mjs`, `postcss.config.mjs`)

## Runtime

- Node.js 20.x (indicated by `@types/node` dependency)
- Browser runtime for Next.js frontend
- npm
- Lockfile: `package-lock.json` present

## Frameworks

- Next.js 16.1.6 - Full-stack framework (App Router)
- React 19.2.3 - UI library
- Tailwind CSS 4.x - CSS framework (using `@tailwindcss/postcss`)
- None - No test runner configured in `package.json`
- Next.js compiler
- TypeScript compiler (`tsc`)
- PostCSS for styling compilation

## Key Dependencies

- `prisma` & `@prisma/client` 7.3.0 - Database ORM
- `next-auth` 5.0.0-beta.30 - Authentication system
- `minio` 8.0.6 - Object storage client for local/self-hosted PDF storage
- `openai` 6.17.0 - LLM API client (configured for custom proxy)
- `pdfjs-dist` 4.0.379 - Primary PDF text extraction library
- `pdf-lib` 1.17.1 - PDF document manipulation and page splitting
- `@prisma/adapter-pg` 7.3.0 / `pg` 8.18.0 - PostgreSQL database client
- `bcryptjs` 3.0.3 - Password hashing
- `zod` 4.3.6 - Input validation schema engine
- `framer-motion` 12.34.0 - UI animation library
- `lucide-react` 0.563.0 - Icon set
- `next-themes` 0.4.6 - Theme management (dark/light mode)

## Configuration

- Configured via `.env` file containing:
- `tsconfig.json` - TypeScript configuration with `@/*` mapping to `./src/*`
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration

## Platform Requirements

- Windows/macOS/Linux
- Docker Desktop (for running PostgreSQL and MinIO services locally)
- Docker container hosting
- `Dockerfile` (multi-stage build) and `docker-compose.yml` configured

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- PascalCase for React component files (e.g., `RegulationList.tsx`, `VersionTimeline.tsx`).
- kebab-case for services, utility libraries, and server action files (e.g., `ai-service.ts`, `diff-engine.ts`, `regulations.ts`).
- Standard Next.js files: `page.tsx`, `layout.tsx`, `route.ts`.
- camelCase for all function names (e.g., `smartExtractPdfText`, `getCurrentUser`, `compareTexts`).
- No specific prefix for async functions (they return `Promise<T>`).
- Event handlers typically prefixed with `handle` (e.g., `handleUpload`, `handleSubmit`).
- camelCase for variables (e.g., `rawText`, `fileSizeMB`, `parsedArticles`).
- UPPER_SNAKE_CASE for global configuration constants (e.g., `MODEL`, `VISION_MODEL`, `MINIO_PORT`, `MAX_SIZE_MB`).
- PascalCase for type aliases, interfaces, and classes.
- No `I` prefix for interfaces (e.g., `ParsedArticle`, `ActionResult<T>`, `CurrentUser`).
- Prisma enums are UPPERCASE (e.g., `VersionStatus.ACTIVE`, `Role.ADMIN`, `ChangeType.ADDED`).

## Code Style

- Semicolons: **Required** at the end of statements.
- Quotes: **Single quotes** for string literals in code (`'use server'`, `'application/pdf'`). Double quotes are acceptable in JSX attributes.
- Indentation: **4 spaces** for indentation.
- Cleanliness: Keep lines under 120 characters where possible.
- Linter: ESLint v9 (`eslint.config.mjs` config).
- Run check: `npm run lint`.
- Strict typing enabled (`tsconfig.json` runs with `"strict": true`). Avoid utilizing `any` where possible.

## Import Organization

- Use `@/*` mapping to `src/*` for all absolute imports. Do not write relative imports going up more than 2 levels (use path alias instead).

## Error Handling

- Must return a standard structured object implementing `ActionResult<T>` to avoid uncaught server-side exceptions crashing the UI:
- Wrap database, storage, and API operations in `try/catch` blocks.
- Log error context using `console.error` before returning a user-friendly message:
- Return `NextResponse.json` with appropriate HTTP status codes (e.g., 401 for Unauthorized, 403 for Forbidden, 429 for Rate Limit, 413 for Payload Too Large, 500 for Internal Server Error).
- Build robust fallbacks for external service failures. If an LLM-based operation fails, fall back to Regex parsing (`ai-service.ts`) or log a warning and continue without breaking the entire process chain (e.g., MinIO upload failure).

## Logging

- Use standard `console.log` for informational execution steps (e.g., `console.log('PDF loaded: 12 pages')`).
- Use `console.error` for errors and warnings.
- Keep logs concise. Never log full database credentials, access tokens, API keys, or raw file contents.

## Comments

- Use double-slash `//` comments to explain *why* code was written in a certain way, or to highlight temporary workarounds/fallbacks.
- Document complex functions using JSDoc/TSDoc notation (`/** ... */`) describing parameters, return values, and behavior.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- **Hybrid Rendering:** Mix of Server Components (default page loading) and Client Components (interactive charts, comparison lists, file uploads).
- **Server Actions:** Data fetching and mutations are encapsulated in Server Actions, avoiding boilerplate API routes.
- **Service-Oriented Libs:** Heavy lifting (PDF processing, AI analysis, OCR, Diff calculation) is delegated to specialized library modules.
- **Verbatim Diff Engine:** Word-by-word comparison using a custom Longest Common Subsequence (LCS) implementation.

## Layers

- Purpose: Render views, manage user input state, and trigger server mutations.
- Contains: Next.js pages under `src/app/**` and components under `src/components/**`.
- Depends on: Server Actions (`src/actions/**`) and Next.js route handlers.
- Purpose: Orchestrate request payloads, enforce authorization, and interact with the database.
- Contains:
- Depends on: Service Layer libraries and Prisma database client.
- Purpose: Core business and infrastructure operations (AI API integration, PDF manipulation, MinIO storage).
- Contains:
- Depends on: Database models, external packages (`pdfjs-dist`, `minio`, `openai`).
- Purpose: Persist users, regulation types, regulations, versions, articles, and article changes.
- Contains: `prisma/schema.prisma` and Prisma client `src/lib/prisma.ts`.

## Data Flow

### PDF Upload & Processing Flow (Streamed SSE)

### Verbatim Comparison & Amendment Tracking Flow

## Key Abstractions

- Standard result wrapper for Server Actions to ensure predictable client-side response structure: `{ success: boolean; data?: T; error?: string }`.
- A chain of fallback methods inside `pdf-service.ts` that tries digital extraction before upgrading to more expensive LLM Vision OCR.
- A custom tokenization and backtracking LCS implementation in `diff-engine.ts` that provides character-level/word-level diffs rather than standard line-based diffs.

## Entry Points

- **Next.js Dev Server:** Port `3006`.
- **Root Page:** `src/app/page.tsx` (redirects to `/dashboard`).
- **Dashboard Page:** `src/app/dashboard/page.tsx` (home for search and status).
- **Upload Route:** `/api/upload` (streamed file handler).
- **Auth Endpoint:** `/api/auth/[...nextauth]` (manages credentials login).

## Error Handling

- **Action Wrapper:** Try/catch wrapping of database mutations returning user-facing error messages instead of leaking database errors.
- **Parser Fallbacks:** The PDF-to-Text pipeline falls back from pdfjs to pdf-parse to vision OCR. The Article parsing pipeline falls back from AI to Regex.
- **MinIO Upload Tolerance:** If MinIO fails, the upload logs a warning and proceeds with parsing text anyway to avoid blocking the user.

## Cross-Cutting Concerns

- **Zod Input Validation:** Performed at upload and login boundaries using schemas defined in `src/lib/validations.ts`.
- **Role Guards:** Direct routing guards (`middleware.ts` / server component role checks) utilizing `isAdminRole()` from `src/lib/authorization.ts` to block non-admins from uploading.
- **Rate Limiting:** `/api/upload` API endpoint is rate-limited using a memory-based token bucket limiter (`src/lib/rate-limit.ts`).

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
