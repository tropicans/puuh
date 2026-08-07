# Phase 5 Plan: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express)

Reorganisasi struktur direktori monorepo dengan memindahkan codebase Next.js saat ini ke direktori `frontend/`, menginisialisasi boilerplate backend Express.js + TypeScript di direktori `backend/`, serta mengonfigurasi pendelegasian script npm di root menggunakan npm workspaces agar koordinasi running/building/linting antar package berjalan secara seamless.

## Proposed Changes

### Root Configuration
- **package.json**: Konfigurasi workspaces `["frontend", "backend"]`, tambahkan `concurrently` di `devDependencies` root, dan delegasikan script dev, build, lint, format, test, dan prisma ke workspace masing-masing.
- **.gitignore**: Tambahkan ignore pattern untuk `node_modules/`, `dist/`, dan `.next/` di level workspace.
- **docker-compose.yml**: Ubah build context service `app` menjadi `./frontend`.

### Frontend Workspace (`frontend/`)
- Pindahkan seluruh asset Next.js (`src/`, `public/`, `prisma/`) dan file konfigurasi (`next.config.ts`, `tsconfig.json`, `components.json`, `eslint.config.mjs`, `postcss.config.mjs`, `prisma.config.ts`, `seed-users.ts`, `vitest.config.ts`, `.env`, `.env.example`, `next-env.d.ts`, `Dockerfile`) ke folder `frontend/`.
- Ubah package name di `frontend/package.json` menjadi `"frontend"`.
- Konfigurasikan path alias `@backend/*` di `frontend/tsconfig.json` yang mengarah ke `../backend/src/*` untuk mendukung direct type sharing.
- Ubah rules eslint `@typescript-eslint/no-explicit-any` ke `"warn"`.

### Backend Workspace (`backend/`)
- Inisialisasi boilerplate Node/Express + TypeScript dengan folder modular (`backend/src/app.ts`, `backend/src/server.ts`, dan `backend/src/routes/index.ts`).
- Konfigurasikan `backend/tsconfig.json` dan `backend/eslint.config.mjs`.

## Verification Plan

### Automated Tests
- Run `npm run test --workspace=frontend`

### Manual Verification
1. Run `npm install` at root and check workspace links.
2. Run `npm run dev` to verify both servers start successfully.
3. Run `npm run build` and `npm run lint` at root.
