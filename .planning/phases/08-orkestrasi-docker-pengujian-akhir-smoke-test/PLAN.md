# Phase 8 Plan: Orkestrasi Docker, Pengujian Akhir & Smoke Test

Penyesuaian konfigurasi `docker-compose.yml`, penyediaan production Dockerfile untuk backend Express.js, pemisahan environment variables (.env) antara frontend dan backend, verifikasi networking antar container, serta pengujian alur kerja end-to-end secara penuh menggunakan script smoke test (`scripts/smoke-flow.mjs`) di lingkungan Docker.

## Proposed Changes

### Docker & Infrastructure Configuration

- **backend/Dockerfile** [NEW]: Multi-stage build (`node:20-alpine`) untuk Express backend.
- **backend/.dockerignore** [NEW]: Dockerignore untuk folder backend.
- **frontend/.dockerignore** [NEW]: Dockerignore untuk folder frontend.
- **docker-compose.yml**:
  - Konfigurasi `app` service untuk build dari `frontend/Dockerfile`.
  - Tambahkan `backend` service yang di-build dari `backend/Dockerfile` dan listen di port `3007`.
  - Tambahkan `db-migrate` service sebagai penampung migrasi dan seed database satu-shot sebelum backend berjalan.
  - Pisahkan `env_file` untuk masing-masing container.

### Scripts & Seeder

- **backend/package.json**: Tambahkan script startup yang benar.
- **backend/prisma/seed.ts**: Sesuaikan admin seeder.
- **frontend/Dockerfile**: Perbarui healthcheck command ke URL `/login` yang bersifat public.

## Verification Plan

### Automated Tests
- Run `npm run test` di root untuk memastikan semua unit test di workspaces (frontend & backend) berjalan sukses.

### Manual / Smoke Verification
1. Run `docker compose down && docker compose up --build -d` untuk memverifikasi container orkestrasi berjalan dengan status sehat.
2. Run `npm run smoke` (dengan user credentials diset) untuk memverifikasi seluruh alur aplikasi berjalan 100% tanpa error di docker.
