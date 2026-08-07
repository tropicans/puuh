# Phase 5 Summary: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express)

Reorganisasi struktur direktori monorepo dengan memindahkan codebase Next.js ke direktori `frontend/`, menginisialisasi boilerplate backend Express.js + TypeScript di direktori `backend/`, serta mengonfigurasi workspaces dan pendelegasian script npm di root.

## Changes Made

1. **Monorepo Structure**:
   - Next.js dipindahkan ke folder `frontend/` dan berhasil dibuild (`npm run build`).
   - Boilerplate Express + TypeScript diinisialisasi di folder `backend/`.

2. **Root Configuration**:
   - `package.json` di root dikonfigurasi dengan `workspaces: ["frontend", "backend"]`.
   - Script root (`dev`, `build`, `lint`, `format`, `test`, `db:*`) didelegasikan ke workspace masing-masing.
   - Dependency `concurrently` ditambahkan di root untuk menjalankan frontend dan backend secara simultan.

3. **TypeScript Integration**:
   - Path alias `@backend/*` ditambahkan di `frontend/tsconfig.json` yang mengarah ke `../backend/src/*` untuk type sharing.
