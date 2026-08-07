# Phase 11 Plan: LLM Structured Outputs & Advanced Article Structuring

Mengintegrasikan fitur Structured Outputs OpenAI/LLM SDK untuk parsing pasal yang andal serta mendukung chunking berjenjang untuk dokumen teks panjang.

## Proposed Changes

### AI Service Integrations
- **backend/src/lib/ai-service.ts** [MODIFY]:
  - Ubah parser AI untuk menggunakan OpenAI Structured Outputs (Response Format JSON Schema) berbasis Zod.
  - Implementasikan Zod schema `ArticleSchema` untuk memvalidasi struktur output pasal (`number` dan `content`).
  - Implementasikan modul pemecah teks (hierarchical chunking) per halaman atau bab untuk dokumen berukuran besar agar tidak melanggar context window / output token limits.
  - Gabungkan hasil parsing dari masing-masing chunk secara cerdas sebelum menyimpan ke database.

## Verification Plan

### Automated Tests
- Pastikan tes unit pada AI service berjalan dengan Vitest:
  - `npx vitest run src/lib/ai-service.test.ts`
