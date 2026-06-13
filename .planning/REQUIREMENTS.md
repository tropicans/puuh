# Requirements: PUU Tracker Documentation

**Defined:** 2026-06-13
**Core Value:** Enable users and developers to understand, run, develop, and deploy the PUU Tracker application through comprehensive documentation.

## v1 Requirements

Requirements for this milestone cycle (v1.2). Each maps to roadmap phases.

### Documentation

- [ ] **DOC-01**: Create User Guide detailing PDF Upload, Verbatim Diff comparison, and search usage.
- [ ] **DOC-02**: Create Developer Guide detailing codebase layout, Prisma/PostgreSQL/MinIO details, and guide for adding features.
- [ ] **DOC-03**: Create System Architecture & Data Flow detailing verbatim diff engine and text extraction fallback mechanism.
- [ ] **DOC-04**: Create API Specification detailing endpoint description, input validation, and auth guards.
- [ ] **DOC-05**: Create Deployment & Operations guide detailing Docker compose, database migrations, and environment setup.

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
| DOC-01 | Phase 5 | Pending |
| DOC-02 | Phase 5 | Pending |
| DOC-03 | Phase 5 | Pending |
| DOC-04 | Phase 5 | Pending |
| DOC-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0 ✓
