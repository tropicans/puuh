# Phase 5: Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express) - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganisasi struktur direktori monorepo dengan memindahkan codebase Next.js saat ini ke direktori `frontend/`, menginisialisasi boilerplate backend Express.js + TypeScript di direktori `backend/`, serta mengonfigurasi pendelegasian script npm di root menggunakan npm workspaces agar koordinasi running/building/linting antar package berjalan secara seamless.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Setup
- **D-01:** Gunakan **npm workspaces** sebagai strategi manajemen monorepo. Root `package.json` akan mendefinisikan workspace untuk folder `frontend` dan `backend` dengan sharing single `package-lock.json` untuk optimasi caching dependencies.

### TypeScript Type-Sharing
- **D-02:** Gunakan **Direct Import Path Alias**. Buat path alias di `tsconfig.json` frontend (Next.js) yang mengarah langsung ke backend type files (misalnya `@backend/types/*`), sehingga tidak membutuhkan build steps atau shared package terpisah untuk deployment lokal.

### Root Script Coordination & Dev Setup
- **D-03:** Gunakan **concurrently** di root `package.json` untuk menjalankan dev server. Perintah `npm run dev` di root akan memicu dev server frontend (port 3006) dan dev server backend (port 3007) secara paralel dalam satu window terminal dengan prefix warna yang jelas.

### Express Backend Boilerplate Structure
- **D-04:** Gunakan **Modular structure** untuk Express backend boilerplate. Inisialisasi directory structure di dalam `backend/src/` dengan folder `routes/`, `controllers/`, `config/`, dan file entrypoint `app.ts` / `server.ts` untuk mempermudah migrasi modul Prisma dan services di Phase 6.

### the agent's Discretion
Semua keputusan implementasi mengikuti rekomendasi utama yang disetujui pengguna. the agent memiliki fleksibilitas penuh untuk menentukan struktur boilerplate modular Express dan konfigurasi build TypeScript backend yang kompatibel dengan package manager workspaces.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope & Requirements
- `.planning/ROADMAP.md` §Phase 5 — Goal, success criteria, and roadmap layout
- `.planning/REQUIREMENTS.md` §1 (MONO-01 to MONO-04) — Requirements for monorepo configuration

### Existing Workspace Configurations
- `package.json` — Root package dependencies and scripts to be restructured
- `tsconfig.json` — TS compiler options to be referenced/migrated

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **tsconfig.json**: Dapat digunakan sebagai acuan / extend configuration untuk boilerplate backend dan frontend.
- **eslint.config.mjs** / **postcss.config.mjs** / **tailwind.config.js**: File konfigurasi styling dan linting ini akan dipindahkan ke folder `frontend/` atau disesuaikan untuk menyesuaikan scope baru.

### Established Patterns
- **Port Allocation**: Saat ini Next.js dev server berjalan pada port `3006` (sebagaimana didefinisikan pada script `dev` di root `package.json`). Port ini harus tetap dipertahankan untuk frontend Next.js. Backend Express akan dialokasikan pada port `3007`.

### Integration Points
- **Root NPM Scripts**: Developer interface utama (`npm run dev`, `npm run build`, `npm run lint`) harus didelegasikan dengan benar agar koordinasi multi-package berjalan otomatis.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-Reorganisasi Direktori & Inisialisasi Monorepo (Next.js & Express)*
*Context gathered: 2026-08-07*
