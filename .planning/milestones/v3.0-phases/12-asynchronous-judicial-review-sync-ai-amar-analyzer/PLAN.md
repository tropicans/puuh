# Phase 12 Plan: Asynchronous Judicial Review Sync & AI Amar Analyzer

Refactoring alur sinkronisasi putusan JR ke background task, peningkatan ketahanan scraping JR (user-agents/proxies), serta interpretasi pasal terpengaruh berbasis LLM.

## Proposed Changes

### Background Task Integration & Resilience
- **backend/src/lib/worker.ts** [MODIFY]:
  - Tambahkan handler untuk tugas `SYNC_JR` agar sinkronisasi putusan Judicial Review berjalan asinkron di latar belakang.
- **backend/src/lib/judicial-review-search.ts** [MODIFY]:
  - Meningkatkan ketahanan scraping terhadap IP block menggunakan rotasi User-Agents dan optimasi request.
- **backend/src/lib/ai-service.ts** [MODIFY]:
  - Implementasikan modul LLM analyzer (`analyzeJudicialReviewAmar`) untuk memetakan dampak putusan secara cerdas ke pasal terkait.

## Verification Plan

### Automated Tests
- Jalankan pengujian integrasi scraping dan JR logic:
  - `npx vitest run src/lib/judicial-review.test.ts`
  - `npx vitest run src/lib/worker.test.ts`
