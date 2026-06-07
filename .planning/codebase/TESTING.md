# Testing Patterns

**Analysis Date:** 2026-06-07

## Test Framework

**Runner:**
- **None currently configured.** No unit, integration, or end-to-end test framework is set up in `package.json` or present in the repository files.

**Assertion Library:**
- None.

**Run Commands:**
- Currently, `npm test` is not configured.

## Diagnostic API Routes

For integration testing, the application has built-in diagnostic and bootstrapping endpoints that can be hit via HTTP requests to verify external connections and seed testing data:

**1. LLM API Diagnostics:**
- Endpoint: `GET /api/test-ai`
- Purpose: Inspects environment variables for OpenAI setup and runs a connection ping test.

**2. LLM Vision/OCR Diagnostics:**
- Endpoint: `GET /api/test-vision`
- Purpose: Checks whether a vision-capable model (like `gemini-2.5-flash`) is accessible through the configured proxy.

**3. Database Seeding:**
- Endpoint: `POST /api/seed`
- Purpose: Seeds initial regulation types, a sample regulation ("Jaminan Kesehatan" with versions from 2018, 2019, 2020), and creates default testing user roles (`admin@puu.local` with password `admin123` and `viewer@puu.local` with password `viewer123`).
- Security Rule: Allowed unauthenticated if zero users exist in the DB (for bootstrap). Otherwise, requires an active authenticated `ADMIN` session.

**4. DB Connection Status:**
- Endpoint: `GET /api/db-status`
- Purpose: Verifies Postgres connectivity and returns statistical counts of regulations, versions, and articles.

## Manual Verification Workflows

Since automated tests are not present, changes must be verified manually:

**1. Authentication Verification:**
- Navigate to `/login` and test authentication with seeded users:
  - Admin: `admin@puu.local` / `admin123`
  - Viewer: `viewer@puu.local` / `viewer123`
- Verify that only admins can access `/upload` and perform mutations.

**2. PDF Parser Verification:**
- Go to `/upload`, upload a sample regulation PDF.
- Monitor the Server-Sent Events (SSE) progress logs in the UI.
- Verify that the PDF is uploaded to MinIO storage and text is successfully parsed into articles.

**3. Amendment Diff Verification:**
- Go to `/compare` and choose two different versions of a regulation.
- Verify that the word-by-word diff is rendered correctly (deleted words highlighted in red, inserted words in green).
- Verify that the AI summary and change significance annotations are populated.

## Recommended Frameworks to Introduce

If the project requires automated test runner integration in the future, the following structure is recommended:

**Framework Choice: Vitest**
- Why: Native ESM support, fast execution, seamless TypeScript integration, and configuration simplicity in Next.js.
- Dependencies to install: `npm install -D vitest @vitejs/plugin-react`
- Recommended npm scripts to add:
  ```json
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
  ```
- Test File Organization: Collocated testing files ending with `.test.ts` or `.test.tsx` next to the source files they test.
  ```
  src/
    lib/
      diff-engine.ts
      diff-engine.test.ts
  ```

---

*Testing analysis: 2026-06-07*
*Update when test patterns change*
