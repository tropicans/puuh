# Requirements: PUU Tracker Stabilization & Enhancement

**Defined:** 2026-06-08
**Core Value:** Enable users to trace and visualize verbatim changes in articles across different versions of Indonesian legislation, and find them quickly.

## v1 Requirements

Requirements for this milestone cycle (v1.1). Each maps to roadmap phases.

### PDF Processing Resilience

- [ ] **RESIL-01**: Implement page-by-page fallback recovery in `pdf-service.ts`. If page-splitting via `pdf-lib` fails on a PDF file, catch the error and process pages one by one defensively.

### Semantic Search & Indexing

- [ ] **SEARCH-01**: Implement legal article embeddings generation using the OpenAI/Gemini API and store the embedding vectors in PostgreSQL.
- [ ] **SEARCH-02**: Implement a natural language query interface in the dashboard allowing users to execute semantic searches across indexed legal articles.

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
| RESIL-01 | Phase 4 | Pending |
| SEARCH-01 | Phase 5 | Pending |
| SEARCH-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 3 total
- Mapped to phases: 0
- Unmapped: 3 ⚠️
