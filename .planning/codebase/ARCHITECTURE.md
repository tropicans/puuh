# Architecture

**Analysis Date:** 2026-07-25

## Pattern Overview

**Overall:** Next.js Full-Stack App Router Architecture

**Key Characteristics:**
- **Hybrid Rendering:** Mix of server-rendered components for fast load times and client components for interactive UI (e.g. diff visualizers, file uploads).
- **Server Actions:** Mutations and data fetches are encapsulated in React Server Actions (under `src/actions/`), reducing the need for REST API endpoints.
- **Service-Oriented Core:** Key operations (PDF parsing, OCR, AI analysis, text diffing) are decoupled into isolated services under `src/lib/`.
- **Verbatim Diff Engine:** Word-by-word comparison using a custom Longest Common Subsequence (LCS) implementation.

## Layers

**UI Layer (Client & Server Components):**
- Purpose: Render views, manage user input/state, and present differences/timelines.
- Contains: Next.js pages under `src/app/**` and UI components under `src/components/**`.
- Depends on: Server Actions (`src/actions/**`) for data mutations and retrieval.

**Action Layer (Server Actions):**
- Purpose: Orchestrate request payloads, check role authorization, and handle database updates.
- Contains: `src/actions/regulations.ts` (regulation management) and `src/actions/users.ts` (user accounts).
- Depends on: Service Layer libraries and Prisma database client.
- Used by: UI Components.

**Service Layer (Business & Infrastructure Logic):**
- Purpose: Execute heavy processing (PDF parsing, OCR, diffing, external fetches).
- Contains:
  - `src/lib/pdf-service.ts` (PDF parsing)
  - `src/lib/ocr-service.ts` (Google Vision OCR)
  - `src/lib/diff-engine.ts` (custom LCS comparison engine)
  - `src/lib/ai-service.ts` (structure extraction and analysis)
  - `src/lib/storage.ts` (MinIO storage client wrapper)
  - `src/lib/regulation-fetcher.ts` (Pasal.id API client)
- Depends on: External libraries (`pdfjs-dist`, `pdf-lib`, `openai`, `minio`, `pg`), database layer.
- Used by: Action layer and route handlers.

**Database/Data Layer (ORM & Storage):**
- Purpose: Manage persistence of users, regulations, versions, articles, and diffs.
- Contains: Prisma client in `src/lib/prisma.ts` and schema definitions in `prisma/schema.prisma`.
- Used by: Action layer, Service layer, and Route handlers.

## Data Flow

**PDF Upload & Processing Flow (Streamed SSE):**
1. Admin uploads PDF to `/api/upload` endpoint.
2. The upload route handler (`src/app/api/upload/route.ts`) checks rate limits and authorization.
3. The PDF is stored in MinIO storage using `storage.uploadFile` from `src/lib/storage.ts`.
4. PDF text is extracted digitally via `smartExtractPdfText` (`src/lib/pdf-service.ts`). If scanned or empty, it falls back to Google Vision OCR (`src/lib/ocr-service.ts`).
5. AI-assisted parser (`src/lib/ai-service.ts`) structures the extracted text into chapters, articles, and clauses.
6. The structured content is written to PostgreSQL via Prisma.

**Verbatim Comparison & Amendment Tracking Flow:**
1. User requests a comparison of Article X between Version A and Version B.
2. The client fetches the article contents from the database.
3. The text is compared using `compareTexts` from `src/lib/diff-engine.ts`.
4. The custom tokenization and backtracking LCS identifies equal, inserted, and deleted segments.
5. The UI renders the highlighted differences side-by-side or inline.

**State Management:**
- Relational state is persisted in PostgreSQL database.
- Original PDF files are stored in MinIO.
- UI state is managed using React local state and next-themes for dark/light preferences.

## Key Abstractions

**ActionResult Wrapper:**
- Purpose: Standard structured result object for Server Actions to ensure predictable responses.
- Pattern: `{ success: boolean; data?: T; error?: string }`.

**PDF Extraction Pipeline:**
- Purpose: Decoupled fallback mechanism that starts with digital extraction (pdfjs, pdf-parse) and upgrades to OCR if text is sparse.

**Custom Tokenizer & Diff Engine:**
- Purpose: Tokenizes Indonesian legal texts for word-by-word comparison instead of line-by-line.
- Pattern: Custom Longest Common Subsequence (LCS) tracking.

## Entry Points

**CLI / Local Server:**
- Location: `localhost:3006` (Next.js server).
- Triggers: User visits pages or makes API calls.

**HTTP API Routes:**
- `/api/auth/[...nextauth]` - Handles credentials-based sign-in.
- `/api/upload` - Admin PDF upload streamed endpoint.
- `/api/documents/[filename]` - Proxies requests to MinIO bucket objects.

## Error Handling

**Strategy:** Fail-safe operations returning controlled responses.
- Database queries and API calls are wrapped in standard `try/catch` blocks.
- If MinIO uploads fail, a warning is logged but text parsing continues to keep the app functional.
- AI parsing errors fall back to regex-based structures.

## Cross-Cutting Concerns

**Validation:**
- Performed via Zod schemas inside `src/lib/validations.ts`.

**Role Guards:**
- Direct guards (`middleware.ts` and `src/lib/authorization.ts`) ensure only authenticated administrators can access upload features.

**Logging:**
- Standard console logging (`console.log` for execution progress and `console.error` for exceptions).

---

*Architecture analysis: 2026-07-25*
*Update when major patterns change*
