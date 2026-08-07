# Roadmap: PUU Tracker

## Milestones

- ✅ **v1.0 Integrasi Docling** — Phases 1–4 (shipped 2026-08-07)
- ✅ **v2.0 Pemisahan Service Frontend dan Backend** — Phases 5–8 (shipped 2026-08-07)
- ⏳ **v3.0 Optimasi, Cleanup & Fitur Lanjutan** — Phases 9–13 (planned)

## Phases

<details>
<summary>✅ v1.0 Integrasi Docling (Phases 1–4) — SHIPPED 2026-08-07</summary>

- [x] Phase 1: Infrastruktur & Integrasi Docker (1/1 plans) — completed 2026-08-06
- [x] Phase 2: Core PDF Service Integration (1/1 plans) — completed 2026-08-06
- [x] Phase 3: Pemrosesan Tabel & Markdown (1/1 plans) — completed 2026-08-06
- [x] Phase 4: LLM & UI Integration (1/1 plans) — completed 2026-08-06

Full details: [.planning/milestones/v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 Pemisahan Service Frontend dan Backend (Phases 5–8) — SHIPPED 2026-08-07</summary>

- [x] Phase 5: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express) (1/1 plans) — completed 2026-08-07
- [x] Phase 6: Migrasi Database & Core Services ke Backend Express (1/1 plans) — completed 2026-08-07
- [x] Phase 7: Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern) (1/1 plans) — completed 2026-08-07
- [x] Phase 8: Orkestrasi Docker, Pengujian Akhir & Smoke Test (1/1 plans) — completed 2026-08-07

Full details: [.planning/milestones/v2.0-ROADMAP.md](./milestones/v2.0-ROADMAP.md)

</details>

### Phase 9: Background Task Queue & Database Schema Migration

**Goal**: Menambahkan model ProcessTask ke schema database, melakukan migrasi, dan mengimplementasikan core background worker terintegrasi untuk Express.
**Depends on**: Phase 8 (v2.0 complete)
**Requirements**: ASYNC-01, ASYNC-02, ASYNC-03
**Plans**: 1 plan

Plans:
- [x] 09-01: Migrasi skema database untuk `ProcessTask` dan implementasi lightweight polling background worker serta status API endpoint di backend Express.

**Success Criteria:**
1. Model `ProcessTask` berhasil dimigrasikan ke PostgreSQL dan client diregenerasi.
2. Background worker berjalan saat server start, mendeteksi task `PENDING`, mengubah status menjadi `PROCESSING`, dan memproses task dengan benar.
3. Endpoint `GET /api/tasks/:id` mengembalikan data status tugas dengan akurat.

---

### Phase 10: Asynchronous PDF Processing & Frontend Integration

**Goal**: Mengubah alur ekstraksi PDF di backend agar berjalan asinkron melalui antrean, melakukan paralelisasi halaman Vision OCR, dan mengintegrasikan visual progress di UI upload frontend.
**Depends on**: Phase 9
**Requirements**: ASYNC-04, PAR-01
**Plans**: 1 plan

Plans:
- [ ] 10-01: Refactoring API upload backend agar asinkron, paralelisasi halaman Vision OCR (menggunakan `p-limit`), dan integrasi halaman unggah dokumen di frontend agar melakukan polling status tugas.

**Success Criteria:**
1. Request upload PDF segera mengembalikan status `202 Accepted` dengan `taskId` dalam milidetik.
2. Pemrosesan PDF berjalan di background worker, dengan Vision OCR berjalan secara paralel (memangkas waktu pemrosesan scanned PDF).
3. Halaman upload frontend menampilkan persentase progress dan tahapan ekstraksi real-time, lalu mengarahkan ke halaman detail peraturan setelah sukses.

---

### Phase 11: LLM Structured Outputs & Advanced Article Structuring

**Goal**: Mengintegrasikan fitur Structured Outputs OpenAI/LLM SDK untuk parsing pasal yang andal serta mendukung chunking berjenjang untuk dokumen teks panjang.
**Depends on**: Phase 10
**Requirements**: STRUC-01, CHUNK-01
**Plans**: 1 plan

Plans:
- [ ] 11-01: Perbarui parser LLM dengan Structured Outputs (Response Format JSON Schema) dan implementasi modul pemecah teks (chunking) berjenjang per halaman/bab untuk dokumen berukuran besar.

**Success Criteria:**
1. Model AI merespons dalam struktur JSON valid yang sesuai dengan skema Zod `Article` secara konsisten tanpa kegagalan format JSON.
2. Dokumen peraturan panjang (> 20.000 karakter) berhasil diurai menggunakan AI secara bertahap dan digabungkan kembali tanpa terpotong dan tanpa langsung dialihkan ke fallback regex.

---

### Phase 12: Asynchronous Judicial Review Sync & AI Amar Analyzer

**Goal**: Refactoring alur sinkronisasi putusan JR ke background task, peningkatan ketahanan scraping JR (user-agents/proxies), serta interpretasi pasal terpengaruh berbasis LLM.
**Depends on**: Phase 11
**Requirements**: JR-01, JR-02
**Plans**: 1 plan

Plans:
- [ ] 12-01: Refactor JR sync menjadi background task, penanganan resiliensi scraping putusan MK/MA, dan implementasi modul LLM untuk menganalisis amar putusan secara cerdas guna memetakan dampak pasal.

**Success Criteria:**
1. Tombol sinkronisasi JR bekerja secara asinkron di latar belakang tanpa risiko timeout.
2. Pencarian putusan JR di produksi tidak diblokir/dibatasi (tahan blokir IP).
3. LLM berhasil menganalisis teks amar putusan MK/MA dan secara tepat memetakan artikel/ayat yang dibatalkan (`INVALIDATED`), bersyarat (`CONDITIONALLY_VALID`), dll.

---

### Phase 13: Kustomisasi Docling OCR, Caching & Refactoring TypeScript

**Goal**: Menyediakan toggle opsi OCR per dokumen, caching MD5 hash PDF untuk menghindari ekstraksi ulang, dan refactoring backend types untuk membersihkan linting warnings `any`.
**Depends on**: Phase 12
**Requirements**: OCR-01, PERF-01, CLEAN-01
**Plans**: 1 plan

Plans:
- [ ] 13-01: Implementasi UI toggle OCR admin, modul caching berbasis hash dokumen di backend, serta perbaikan tipe TypeScript di seluruh codebase backend.

**Success Criteria:**
1. Admin dapat menyetel apakah PDF harus diekstraksi menggunakan OCR, Docling biasa, atau auto di UI.
2. Mengunggah file PDF yang persis sama tidak memicu ekstraksi ulang (teks dimuat dari cache database/storage secara instan).
3. Backend Express lolos build TypeScript tanpa peringatan linting `no-explicit-any`.

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Infrastruktur & Integrasi Docker | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 2. Core PDF Service Integration | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 3. Pemrosesan Tabel & Markdown | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 4. LLM & UI Integration | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 5. Reorganisasi Direktori & Inisialisasi Monorepo | v2.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 6. Migrasi Database & Core Services | v2.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 7. Integrasi Frontend & Autentikasi/Otorisasi | v2.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 8. Orkestrasi Docker, Pengujian & Smoke Test | v2.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 9. Background Task Queue & Database Schema Migration | v3.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 10. Asynchronous PDF Processing & Frontend Integration | v3.0 | 0/1 | ⏳ Planned | — |
| 11. LLM Structured Outputs & Advanced Article Structuring | v3.0 | 0/1 | ⏳ Planned | — |
| 12. Asynchronous Judicial Review Sync & AI Amar Analyzer | v3.0 | 0/1 | ⏳ Planned | — |
| 13. Kustomisasi Docling OCR, Caching & Refactoring TypeScript | v3.0 | 0/1 | ⏳ Planned | — |
