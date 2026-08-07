# Roadmap: PUU Tracker

## Milestones

- ✅ **v1.0 Integrasi Docling** — Phases 1–4 (shipped 2026-08-07)
- 🚧 **v2.0 Pemisahan Service Frontend dan Backend** — Phases 5–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Integrasi Docling (Phases 1–4) — SHIPPED 2026-08-07</summary>

- [x] Phase 1: Infrastruktur & Integrasi Docker (1/1 plans) — completed 2026-08-06
- [x] Phase 2: Core PDF Service Integration (1/1 plans) — completed 2026-08-06
- [x] Phase 3: Pemrosesan Tabel & Markdown (1/1 plans) — completed 2026-08-06
- [x] Phase 4: LLM & UI Integration (1/1 plans) — completed 2026-08-06

Full details: [.planning/milestones/v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

</details>

### Phase 5: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express)

**Goal**: Memindahkan Next.js ke folder `frontend/`, membuat boilerplate Express.js + TS di `backend/`, dan mengonfigurasi pendelegasian script npm di root.
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: MONO-01, MONO-02, MONO-03, MONO-04
**Plans**: 1 plan

Plans:

- [x] 05-01: Reorganisasi struktur direktori monorepo, inisialisasi Express backend, dan set up workspace/npm scripts.

**Success Criteria:**

1. Semua kode Next.js dipindahkan ke `frontend/` dan berhasil dibuild (`npm run build`).
2. Boilerplate Express + TypeScript berada di `backend/` dan berhasil di-compile tanpa error.
3. Script root `npm run dev` dapat menjalankan frontend dan backend secara simultan (atau terpisah via prefix).
4. Strategi type-sharing dikonfigurasi (misal path import ke backend types bekerja di frontend).

---

### Phase 6: Migrasi Database & Core Services ke Backend Express

**Goal**: Memindahkan Prisma schema & client, integrasi Minio, dan engine ekstraksi PDF/LLM ke backend.
**Depends on**: Phase 5
**Requirements**: API-01, API-02, API-03, API-05, API-06
**Plans**: 1 plan

Plans:

- [x] 06-01: Migrasi Prisma, Minio, PDF/OCR/Docling/LLM parser services ke Express, dan implementasi endpoint API upload & processing.

**Success Criteria:**

1. Database postgres terhubung ke backend Express via Prisma client. Migrasi database dan seeding dapat dijalankan dari folder `backend/`.
2. Endpoint API upload (`/api/upload`) menerima file multi-part (menggunakan multer), mengunggahnya ke Minio, dan memicu ekstraksi Docling/fallback.
3. Seluruh unit tests untuk `pdf-service` dan `ai-service` berhasil dipindahkan ke backend dan pass.

---

### Phase 7: Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern)

**Goal**: Menghubungkan halaman UI Next.js ke REST API Express dan memfungsikan NextAuth melalui API login Express.
**Depends on**: Phase 6
**Requirements**: FE-01, FE-02, FE-03, AUTH-01, AUTH-02
**Plans**: 1 plan

Plans:

- [x] 07-01: Pembaruan API calls di frontend, modifikasi NextAuth credentials provider untuk memanggil backend, dan pengiriman konteks user via custom headers.

**Success Criteria:**

1. Halaman web Next.js dapat menampilkan data regulasi, versi, pasal, dan diff yang diambil dari API Express backend.
2. Login pengguna di frontend Next.js berhasil memvalidasi kredensial ke Express backend.
3. API Calls ke backend mengirimkan headers `X-User-Id` dan `X-User-Role` untuk membatasi aksi admin (seperti upload/seed).

---

### Phase 8: Orkestrasi Docker, Pengujian Akhir & Smoke Test

**Goal**: Penyesuaian konfigurasi `docker-compose.yml`, verifikasi networking antar container, dan pengujian alur kerja end-to-end secara penuh.
**Depends on**: Phase 7
**Requirements**: OPS-01, OPS-02, OPS-03, QA-01, QA-02
**Plans**: 1 plan

Plans:

- [ ] 08-01: Update docker-compose.yml, penanganan environment variables, dan pelaksanaan testing/smoke flow.

**Success Criteria:**

1. Perintah `docker compose up --build` berhasil membangun kontainer `frontend` dan `backend` yang terpisah, serta terhubung dengan `postgres`, `minio`, dan `docling-serve`.
2. Smoke-test script (`scripts/smoke-flow.mjs`) berjalan sukses dan membuktikan alur upload & parse regulasi berhasil 100% tanpa error di docker environment.
3. Pengguna dapat membuka `http://localhost:3006`, login, upload PDF, dan melihat hasil ekstraksi pasal/tabel dengan benar.

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Infrastruktur & Integrasi Docker | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 2. Core PDF Service Integration | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 3. Pemrosesan Tabel & Markdown | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 4. LLM & UI Integration | v1.0 | 1/1 | ✅ Shipped | 2026-08-06 |
| 5. Reorganisasi Direktori & Inisialisasi Monorepo | v2.0 | 1/1 | ✅ Shipped | 2026-08-07 |
| 6. Migrasi Database & Core Services | v2.0 | 1/1 | Complete    | 2026-08-07 |
| 7. Integrasi Frontend & Autentikasi/Otorisasi | v2.0 | 1/1 | ✅ Complete | 2026-08-07 |
| 8. Orkestrasi Docker, Pengujian & Smoke Test | v2.0 | 0/1 | 🚧 In Progress | — |
