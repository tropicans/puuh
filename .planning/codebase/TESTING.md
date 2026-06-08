# Testing Patterns

**Analysis Date:** 2026-06-08

## Test Framework

**Runner:**
- Currently, **no unit/integration testing framework** (such as Jest or Vitest) is installed or configured in `package.json`.
- There are no `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files present in the source directories.

**Custom Smoke Test Runner:**
- The project includes a custom HTTP smoke testing script located at `scripts/smoke-flow.mjs`.
- This script validates endpoint routing, authentication flow handling, session cookie preservation, and error status responses.

**Run Commands:**
```bash
npm run smoke                         # Executes the smoke tests against localhost:3006
```

## Smoke Test Workflow

The smoke test runner (`scripts/smoke-flow.mjs`) performs a sequence of HTTP requests using standard Node.js `fetch` to confirm the application runs correctly:

1. **Environment Variables Configuration:**
   - `SMOKE_BASE_URL`: Base URL of the running target (defaults to `http://localhost:3006`).
   - `SMOKE_TEST_EMAIL`: Email for credentials login testing.
   - `SMOKE_TEST_PASSWORD`: Password for credentials login testing.

2. **Anonymous Checks:**
   - Validates `/` (expects `200`, `307`, or `308`).
   - Validates `/login` (expects `200`).
   - Validates `/compare` (expects `200`, `307`, or `308`).

3. **Authentication Phase (conditional upon email/password environment variables):**
   - Fetches a CSRF token from `/api/auth/csrf`.
   - Sends a `POST` request to `/api/auth/callback/credentials` with credentials and CSRF token.
   - Parses the `Set-Cookie` header to store auth tokens in a local memory cookie jar.

4. **Authenticated Checks:**
   - Validates `/dashboard` (expects `200`).
   - Validates `/manage` (expects `200`, `307`, or `308`).
   - Validates `/settings` (expects `200`, `307`, or `308`).
   - Validates `/api/regulations` (expects `200`).

5. **Failure & Boundary Checks (Destructive Endpoints):**
   - Triggers `DELETE /api/versions/non-existent-id` (expects validation error status `400`, `404`, or `500` rather than allowing unauthenticated bypass).
   - Triggers `DELETE /api/regulations/non-existent-id/manage` (expects `400`, `404`, or `500`).

## Guidelines for Adding Tests

If a testing framework is introduced:

**Unit Tests:**
- **Runner:** Recommended to use **Vitest** for quick ES module compilation.
- **Location:** Collocated alongside target files under a matching name (e.g. `src/lib/diff-engine.test.ts` next to `diff-engine.ts`).
- **Mocking:** Mock filesystem calls (`fs-extra`) or network/LLM calls (`openai` / custom `fetch`) using Vitest `vi.mock`.

**Standard Testing Scripts (recommended to add to `package.json` if configured):**
- `test` - Run all unit tests
- `test:watch` - Interactive test developer loop
- `test:coverage` - Code coverage generation

---

*Testing analysis: 2026-06-08*
*Update when test runners or patterns are added*
