# Architecture

**Analysis Date:** 2026-06-08

## Pattern Overview

**Overall:** Full-stack Next.js Application using App Router (React Server Components, Server Actions, and API Route Handlers).

**Key Characteristics:**
- **Hybrid Rendering:** React Server Components (RSC) for page loading and rendering, Client Components only when browser APIs or state are needed.
- **Server Actions:** Secure business logic mutations triggered directly from client-side elements.
- **Object Storage + Relational DB:** MinIO stores actual PDF files, while PostgreSQL stores structured regulation metadata, versions, parsed articles, and modifications.
- **Stateless Requests:** Stateless session handling via NextAuth JWT callbacks.

## Layers

**Routing & View Layer (`src/app/**`):**
- **Purpose:** Renders UI layouts, handles client interactions, and implements API routes.
- **Contains:** Next.js pages, layouts, custom CSS, client components, and API routes (`src/app/api/**`).
- **Used by:** End-user web browsers.

**Server Actions Layer (`src/actions/**`):**
- **Purpose:** Serve as controller endpoints to handle business logic mutations and database writes.
- **Contains:** `regulations.ts` (regulation metadata and version management), `users.ts` (bootstrap admin and user listing).
- **Depends on:** Data Access Layer (Prisma client) and Services Layer.
- **Used by:** Client Components inside the Routing & View Layer.

**Service Layer (`src/lib/**`):**
- **Purpose:** Implement specialized functional utilities and logic.
- **Contains:**
  - `ai-service.ts`: Article structure extraction and analysis using LLM APIs.
  - `ocr-service.ts`: Image text extraction using Vision LLM.
  - `pdf-service.ts`: Digital text extraction and page splitting utilities.
  - `diff-engine.ts`: Word-level Longest Common Subsequence (LCS) comparison.
  - `storage.ts`: Wrapper for uploading, downloading, and deleting files in MinIO.
- **Depends on:** Native Node.js services, database client, and external service clients (minio, openai).

**Data Access / ORM Layer (`prisma/**` & `src/lib/prisma.ts`):**
- **Purpose:** Manages the database schema, handles pooling, and exports the database client.
- **Contains:** `schema.prisma`, migrations, and the Prisma client singleton (`prisma.ts`).
- **Used by:** Server Actions Layer and API routes.

## Data Flow

**PDF Processing and Parsing Flow:**
1. Administrator uploads a regulation PDF from the client UI.
2. Request goes to the upload API route (`src/app/api/upload/route.ts`).
3. The file is uploaded to the MinIO `puu-documents` bucket via `src/lib/storage.ts`.
4. The backend attempts digital extraction via `src/lib/pdf-service.ts` using `pdfjs-dist` or `pdf-parse`.
5. If the PDF is a scanned document (character count is low), it falls back to `src/lib/ocr-service.ts` to perform Vision-based OCR.
6. The resulting text is parsed into structured articles (e.g., Pasal 1, Pasal 2) by the LLM in `src/lib/ai-service.ts`.
7. Articles and version details are saved to PostgreSQL.

**Regulation Version Comparison Flow:**
1. User requests a comparison between two versions of a regulation in the UI.
2. The comparison route (`src/app/compare/page.tsx`) retrieves the article lists for both versions.
3. The backend runs `src/lib/diff-engine.ts` (`compareTexts`) to calculate word-by-word differences (additions/deletions).
4. Highlights are formatted into HTML diff parts and returned to the client to render green/red highlighting.

**State Management:**
- Relational state: Stored in PostgreSQL, accessed via Prisma client.
- File state: Stored in MinIO object storage.
- Session state: Handled by NextAuth client and server sessions using JWTs.

## Key Abstractions

**ActionResult<T>:**
- **Purpose:** Standardized container return type for Server Actions to ensure predictable success/error payloads.
- **Interface:** `{ success: boolean; data?: T; error?: string }`

**Storage Client (`src/lib/storage.ts`):**
- **Purpose:** Static client wrapper exposing MinIO operations (`uploadFile`, `getFileStream`, `deleteFile`) with automatic bucket creation.

**Diff Engine (`src/lib/diff-engine.ts`):**
- **Purpose:** Tokenizes text, finds the Longest Common Subsequence, and merges identical differences.

## Entry Points

**API Handlers:**
- Location: `src/app/api/**/route.ts`
- Triggers: HTTP requests from client features or third parties.
- Responsibilities: Handle CSRF/NextAuth credentials, regulation retrieval, and uploads.

**Server Actions:**
- Location: `src/actions/regulations.ts`
- Triggers: Interactive component forms.
- Responsibilities: DB writes, revalidating cache paths.

## Error Handling

**Strategy:**
- Wrap database, network, and LLM calls in standard `try/catch` blocks.
- Log error specifics to standard error for debugging.
- Return structured error strings in `ActionResult` or standard JSON response statuses (e.g. `401 Unauthorized`, `403 Forbidden`, `500 Server Error`).

## Cross-Cutting Concerns

**Logging:**
- Console output (`console.log`, `console.error`).

**Validation:**
- Zod schemas in `src/lib/validations.ts` parse, coerce, and check request parameters and form inputs.

**Authentication:**
- Managed via `src/lib/auth.ts` and `src/lib/authorization.ts` to retrieve the current user session and check user roles.

---

*Architecture analysis: 2026-06-08*
*Update when major patterns change*
