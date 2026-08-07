# Phase 8: Orkestrasi Docker, Pengujian Akhir & Smoke Test - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Penyesuaian konfigurasi `docker-compose.yml`, penyediaan production Dockerfile untuk backend Express.js, pemisahan environment variables (.env) antara frontend dan backend, verifikasi networking antar container, serta pengujian alur kerja end-to-end secara penuh menggunakan script smoke test (`scripts/smoke-flow.mjs`) di lingkungan Docker.

</domain>

<decisions>
## Implementation Decisions

### Backend Dockerization Strategy
- **D-01:** Buat `backend/Dockerfile` menggunakan multi-stage build (`node:20-alpine`) yang bersih. Tahap build akan menginstal dependensi dan meng-compile TypeScript via `tsc` ke folder `dist/`. Tahap runner akan menjalankan file JavaScript yang ter-compile dengan perintah `node dist/server.js` menggunakan non-root user (`node`).

### Database Migration & Seeding in Docker
- **D-02:** Buat satu-shot service baru bernama `db-migrate` di `docker-compose.yml`. Service ini bertugas menjalankan migrasi (`npx prisma migrate deploy`) dan seeding (`npx prisma db seed`) sesaat setelah database PostgreSQL sehat (`condition: service_healthy`).
- **D-03:** Kontainer `backend` akan dikonfigurasi untuk menunggu hingga proses migrasi pada kontainer `db-migrate` selesai dengan sukses (`condition: service_completed_successfully`).

### Environment Variable Management
- **D-04:** Konfigurasi pemuatan environment variables di `docker-compose.yml` secara terpisah menggunakan atribut `env_file`. Kontainer `frontend` akan memuat file `frontend/.env` dan kontainer `backend` akan memuat file `backend/.env`.
- **D-05:** Pertahankan default environment variables yang aman (seperti credentials internal MinIO dan database) di dalam masing-masing `.env` file untuk memudahkan deployment lokal maupun docker orchestration.

### Smoke Test & Credentials Seeding
- **D-06:** Proses seeding database (`backend/prisma/seed.ts`) akan memastikan ketersediaan admin user dengan kredensial yang ditentukan oleh `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (default: `admin@test.com` / `password123456`).
- **D-07:** Smoke test (`scripts/smoke-flow.mjs`) akan dijalankan dari host machine melalui perintah `npm run smoke` (atau `$env:PATH = "C:\nvm4w\nodejs;" + $env:PATH; npm run smoke` jika local path bermasalah) setelah kontainer docker compose up berhasil dan berstatus sehat.

### the agent's Discretion
- Struktur skrip bash/entrypoint kustom jika diperlukan untuk menunggu koneksi database sebelum migrasi.
- Konfigurasi logging dan timeout spesifik untuk pengecekan kesehatan (healthcheck) kontainer `frontend` dan `backend` di `docker-compose.yml`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Docker & Infrastructure Configuration
- `.planning/ROADMAP.md` §Phase 8 — Rencana goals, kriteria sukses, dan dependensi fase.
- `.planning/REQUIREMENTS.md` §5 (OPS-01, OPS-02, OPS-03) — Persyaratan orkestrasi Docker dan environment variables.
- `docker-compose.yml` — Konfigurasi orkestrasi saat ini yang perlu disesuaikan dengan penambahan backend.
- `frontend/Dockerfile` — Acuan multi-stage Dockerfile Next.js.

### QA & Testing
- `.planning/REQUIREMENTS.md` §6 (QA-01, QA-02) — Persyaratan unit testing (Vitest) dan smoke testing.
- `scripts/smoke-flow.mjs` — Skrip verifikasi alur end-to-end yang akan dijalankan.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/Dockerfile`: Multi-stage build pattern yang dapat direplikasi untuk `backend/Dockerfile`.
- `backend/prisma/seed.ts`: Dapat diperbarui atau disesuaikan untuk memastikan test admin user ter-seed secara konsisten.

### Established Patterns
- **Healthchecks**: PostgreSQL, MinIO, dan Docling-serve dalam `docker-compose.yml` telah dikonfigurasi dengan healthcheck yang ketat. Service baru (seperti `backend` dan `db-migrate`) harus mengikuti pola ini.
- **Root-level NPM scripts**: Script `npm run smoke` mendelegasikan jalannya smoke test ke root/host context.

### Integration Points
- `backend/Dockerfile` baru terintegrasi ke dalam `docker-compose.yml`.
- `db-migrate` service baru terintegrasi sebagai dependencies resolver sebelum `backend` dimulai.
- `.env` lokal di folder `frontend/` dan `backend/` menggantikan atau membagi variabel dari root `.env`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-orkestrasi-docker-pengujian-akhir-smoke-test*
*Context gathered: 2026-08-07*
