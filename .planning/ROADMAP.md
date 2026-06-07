# Roadmap: PUU Tracker Stabilization & Enhancement

## Overview

Stabilize and enhance the PUU Indonesian legislation tracking application. This roadmap moves the codebase from a stabilized environment to a resilient processing pipeline with intelligent semantic search capabilities.

## Phases

- [x] **Phase 1: Environment & Authentication Security Stabilization** - Align database ports, set up migrations, and implement role guards. (completed 2026-06-07)
- [x] **Phase 2: PDF Parsing & OCR Processing Optimizations** - Parallelize vision OCR chunking and improve parser fallback logic. (completed 2026-06-07)
- [x] **Phase 3: Diff Engine Verification & Testing Pipeline** - Add Vitest framework and write diff engine unit tests. (completed 2026-06-07)
- [ ] **Phase 4: PDF Processing Resilience** - Implement single-page defensive fallback processing for complex legislation PDFs.
- [ ] **Phase 5: Semantic Search & Indexing** - Add vector embeddings generation, PostgreSQL indexing, and natural language search UI.

---

## Phase Details

### Phase 1: Environment & Authentication Security Stabilization
*(Completed)*

### Phase 2: PDF Parsing & OCR Processing Optimizations
*(Completed)*

### Phase 3: Diff Engine Verification & Testing Pipeline
*(Completed)*

### Phase 4: PDF Processing Resilience

**Goal**: Implement page-by-page fallback recovery in `pdf-service.ts`. If page-splitting via `pdf-lib` fails on a PDF file, catch the error and process pages one by one defensively.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: [RESIL-01]
**Success Criteria**:
  1. Uploading a PDF that fails standard chunk-compilation catches the error and switches to single-page fallback.
  2. Single-page fallback successfully extracts and processes text from each page.
  3. Warning logs are generated when page-by-page fallback is active.

**Plans**: 1 plan
Plans:
- [ ] 04-01: Implement try/catch page-by-page fallback processing in the PDF upload and parsing pipeline.

### Phase 5: Semantic Search & Indexing

**Goal**: Generate legal article embeddings, store/index them in PostgreSQL, and implement a natural language AI search query interface.
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: [SEARCH-01, SEARCH-02]
**Success Criteria**:
  1. A background mechanism successfully generates vector embeddings (using OpenAI/Gemini API) for parsed legal articles.
  2. Vector embeddings are stored and queryable in PostgreSQL.
  3. A clean natural language AI search bar is available on the dashboard.
  4. Search results display semantically relevant articles sorted by similarity.

**Plans**: 2 plans
Plans:
- [ ] 05-01: Implement embeddings generation and PostgreSQL storage schema for legal articles.
- [ ] 05-02: Implement semantic search query action and natural language search UI.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Environment & Auth Security | 2/2 | Complete | 2026-06-07 |
| 2. Parser & OCR Optimization | 2/2 | Complete | 2026-06-07 |
| 3. Testing Pipeline | 1/1 | Complete | 2026-06-07 |
| 4. PDF Processing Resilience | 0/1 | Not started | - |
| 5. Semantic Search & Indexing | 0/2 | Not started | - |
