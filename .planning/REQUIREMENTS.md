# Requirements: PUU Tracker Documentation Updates

**Defined:** 2026-07-25
**Core Value:** Ensure that the system documentation is complete, accurate, and covers all recently added features (BPK Fetcher, Pasal.id fallback, API endpoints, etc.).

## v1.6 Requirements

Requirements for this milestone cycle (v1.6). Each maps to roadmap phases.

### Documentation Updates

- [ ] **DOC-06**: Update `docs/api-specification.md` to detail the `/api/regulations/fetch` streamed POST endpoint, request parameters, and progress Server-Sent Events structure.
- [ ] **DOC-07**: Update `docs/architecture.md` with description of BPK crawler search and Pasal.id API fallback flow integration.
- [ ] **DOC-08**: Update `docs/deployment.md` and `docs/developer-guide.md` to detail `PASAL_ID_TOKEN` config and codebase fetcher functions.
- [ ] **DOC-09**: Update `docs/user-guide.md` to instruct on the UI dashboard search bar automatic download usage.
- [ ] **DOC-10**: Verify all documentation files build, compile, have correct internal links, and present clean formatting.

## Completed Requirements (v1.4 & v1.5)

Successfully completed in Milestones v1.4 and v1.5.

### Automatic Fetcher & Pasal.id Fallback

- ✓ **FETCH-01**: Fix `pdf-parse` implementation in the codebase by using the modern `PDFParse` class API to avoid runtime crashes.
- ✓ **FETCH-02**: Normalize and decode URI components for BPK search result slugs and titles to correctly filter matches with spaces.
- ✓ **FETCH-03**: Verify E2E that finding "Peraturan Presiden No. 82 Tahun 2018" automatically successfully searches, downloads, parses, and persists without needing manual upload.
- ✓ **FETCH-04**: Implement Pasal.id search and details API fetching fallback using personal token authentication in `regulation-fetcher.ts`.
- ✓ **FETCH-05**: Clean up and remove dead Setkab crawler URL pattern generation.

## Completed Requirements (v1.3)

Successfully completed in Milestone v1.3.

### Feature Verification

- ✓ **VERIFY-01**: Verify that the application builds, lints, and runs correctly in Docker with PostgreSQL and MinIO, and database migrations/seeding work.
- ✓ **VERIFY-02**: Verify that PDF uploads to MinIO work correctly and the files are successfully stored and retrieved.
- ✓ **VERIFY-03**: Verify that digital PDF text extraction (`pdfjs-dist`) extracts characters accurately.
- ✓ **VERIFY-04**: Verify that scanned PDF Vision OCR processes chunks concurrently using `gemini-2.5-flash` under API proxy.
- ✓ **VERIFY-05**: Verify that the LLM-assisted article parser and the Regex fallback parser segment legal texts into proper article JSON formats.
- ✓ **VERIFY-06**: Verify that the verbatim LCS diff engine passes all unit tests and accurately maps word-level differences.
- ✓ **VERIFY-07**: Verify that credentials authentication (NextAuth) and role-based access control (guards on pages/actions) restrict access properly.

## Completed Requirements (v1.2)

Successfully completed in Milestone v1.2.

### Documentation

- ✓ **DOC-01**: Create User Guide detailing PDF Upload, Verbatim Diff comparison, and search usage.
- ✓ **DOC-02**: Create Developer Guide detailing codebase layout, Prisma/PostgreSQL/MinIO details, and guide for adding features.
- ✓ **DOC-03**: Create System Architecture & Data Flow detailing verbatim diff engine and text extraction fallback mechanism.
- ✓ **DOC-04**: Create API Specification detailing endpoint description, input validation, and auth guards.
- ✓ **DOC-05**: Create Deployment & Operations guide detailing Docker compose, database migrations, and environment setup.

## Completed Requirements (v1.1)

Successfully completed in Milestone v1.1.

### PDF Processing Resilience

- ✓ **RESIL-01**: Implement page-by-page fallback recovery in `pdf-service.ts`. If page-splitting via `pdf-lib` fails on a PDF file, catch the error and process pages one by one defensively.

## Completed Requirements (v1.0)

Successfully completed in Milestone v1.0.

### Security & Environment Config

- ✓ **SEC-01**: Align database URL port mapping in `.env` (`5433`) with `docker-compose.yml` (`5434`).
- ✓ **SEC-02**: Setup standard database migrations flow using Prisma.
- ✓ **SEC-03**: Secure `/upload` and `/manage` pages using role-based checks.
- ✓ **SEC-04**: Extract user seed passwords from hardcoded strings.

### Performance & OCR Robustness

- ✓ **PERF-01**: Optimize scanned PDF Vision OCR chunk processing using concurrent Promise pooling.
- ✓ **PERF-02**: Harden the Regex article-splitting parser in `ai-service.ts` to handle typical OCR typos.
- ✓ **PERF-03**: Adjust the MinIO file upload storage service generated URLs to resolve correctly in browser and server contexts.

### Testing & Verification

- ✓ **TEST-01**: Install and configure Vitest framework.
- ✓ **TEST-02**: Implement automated unit tests for the verbatim LCS diff engine.

## Future Requirements

Deferred to future releases.

- **SEARCH-01**: Implement legal article embeddings generation using the OpenAI/Gemini API and store the embedding vectors in PostgreSQL.
- **SEARCH-02**: Implement a natural language query interface in the dashboard allowing users to execute semantic searches across indexed legal articles.
- **AI-03**: Add automatic summarization of legislation changes using LLMs.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public registration | Only seeded admin/viewer accounts are allowed to access protected features. |
| Support for non-PDF files | System is built exclusively for Indonesian legal files in PDF format. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**

- v1.6 requirements: 5 total
- Mapped to phases: 0
- Unmapped: 5

*Last updated: 2026-07-25*
