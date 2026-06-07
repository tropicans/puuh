# Architecture

**Analysis Date:** 2026-06-07

## Pattern Overview

**Overall:** Full-stack Next.js application utilizing the App Router pattern, with Server Actions for standard mutations/queries and streamed Route Handlers for long-running PDF upload operations.

**Key Characteristics:**
- **Hybrid Rendering:** Mix of Server Components (default page loading) and Client Components (interactive charts, comparison lists, file uploads).
- **Server Actions:** Data fetching and mutations are encapsulated in Server Actions, avoiding boilerplate API routes.
- **Service-Oriented Libs:** Heavy lifting (PDF processing, AI analysis, OCR, Diff calculation) is delegated to specialized library modules.
- **Verbatim Diff Engine:** Word-by-word comparison using a custom Longest Common Subsequence (LCS) implementation.

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render views, manage user input state, and trigger server mutations.
- Contains: Next.js pages under `src/app/**` and components under `src/components/**`.
- Depends on: Server Actions (`src/actions/**`) and Next.js route handlers.

**Action & API Layer:**
- Purpose: Orchestrate request payloads, enforce authorization, and interact with the database.
- Contains:
  - Server Actions: `src/actions/regulations.ts` and `src/actions/users.ts`.
  - API Routes: `src/app/api/upload/route.ts` (SSE stream for upload feedback), `src/app/api/auth/[...nextauth]/route.ts`.
- Depends on: Service Layer libraries and Prisma database client.

**Service Layer:**
- Purpose: Core business and infrastructure operations (AI API integration, PDF manipulation, MinIO storage).
- Contains:
  - `src/lib/ai-service.ts` - Calls proxy LLM for parsing and analysis.
  - `src/lib/pdf-service.ts` - Extracts digital text from PDF.
  - `src/lib/ocr-service.ts` - Orchestrates vision-based OCR chunking.
  - `src/lib/storage.ts` - Manages MinIO bucket uploads/downloads.
  - `src/lib/diff-engine.ts` - Verbatim comparison of text changes.
- Depends on: Database models, external packages (`pdfjs-dist`, `minio`, `openai`).

**Database Layer:**
- Purpose: Persist users, regulation types, regulations, versions, articles, and article changes.
- Contains: `prisma/schema.prisma` and Prisma client `src/lib/prisma.ts`.

## Data Flow

### PDF Upload & Processing Flow (Streamed SSE)

1. **Upload Trigger:** An admin submits a PDF file via the form in `src/app/upload/page.tsx`.
2. **API Entry:** A POST request is sent to `/api/upload` (`src/app/api/upload/route.ts`).
3. **Authorization:** Checks `getCurrentUser()` and `isAdminRole()`.
4. **Stream Initialization:** Initializes a `ReadableStream` returning a `text/event-stream` (SSE) response.
5. **Text Extraction Chain:**
   - Triggers `smartExtractPdfText` (`src/lib/pdf-service.ts`).
   - Tries digital text extraction via `pdfjs-dist`. If text character count is very low, it falls back to `pdf-parse`.
   - If both return minimal text, it detects the PDF as scanned/image and triggers `extractTextWithVision` (`src/lib/ocr-service.ts`), which splits the PDF into 5-page chunks using `pdf-lib` and sends them for vision OCR to the LLM (`gemini-2.5-flash` via proxy).
6. **Object Storage:** The original PDF is uploaded to MinIO storage.
7. **Article Structure Parsing:**
   - Passes extracted text to `parseArticlesFromText` (`src/lib/ai-service.ts`).
   - If text size is <= 20,000 characters, calls LLM to output a clean JSON array of articles.
   - If text is too large or LLM fails, falls back to Regex-based parser `parseArticlesWithRegex` to split sections verbatim by looking for `Pasal` keywords.
8. **Prisma Persistence:** Writes the regulation, version, and articles to PostgreSQL, linking amendments to previous active versions (which are marked `AMENDED`).

### Verbatim Comparison & Amendment Tracking Flow

1. **Comparison Load:** User navigates to `/compare` and selects two regulation versions.
2. **Retrieve Data:** Fetch articles for both versions from the database.
3. **Verbatim Diff:** `compareTexts` (`src/lib/diff-engine.ts`) runs a tokenized LCS algorithm on the text, classifying words into `equal`, `insert`, or `delete` blocks.
4. **AI Annotation:** `analyzeArticleChange` (`src/lib/ai-service.ts`) reviews the old/new text of modified articles, determining the change summary, significance (`minor`, `moderate`, `major`), and affected topics.
5. **Display:** UI highlights added text in green and deleted text in red with AI annotations displayed inline.

## Key Abstractions

**ActionResult:**
- Standard result wrapper for Server Actions to ensure predictable client-side response structure: `{ success: boolean; data?: T; error?: string }`.

**Smart Extraction Pipeline:**
- A chain of fallback methods inside `pdf-service.ts` that tries digital extraction before upgrading to more expensive LLM Vision OCR.

**Verbatim Diff (LCS):**
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

---

*Architecture analysis: 2026-06-07*
*Update when major patterns change*
