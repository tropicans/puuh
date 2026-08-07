# Phase 7 Plan: Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern)

Menghubungkan halaman UI Next.js ke REST API Express, memigrasi NextAuth credentials provider agar verifikasi dilakukan via endpoint backend Express, mengimplementasikan pengiriman konteks user (`X-User-Id`, `X-User-Role`) via custom headers, dan mengamankan route via Next.js Middleware.

## Proposed Changes

### Frontend Infrastructure

- **frontend/src/lib/api.ts** [NEW]: Helper `fetchFromBackend<T>` untuk melakukan server-side HTTP request ke Express backend dengan menyertakan konteks user headers (`X-User-Id` & `X-User-Role`) dari session NextAuth.
- **frontend/src/lib/auth.ts**: Memodifikasi NextAuth credentials provider agar memanggil `POST /api/auth/login` ke backend Express untuk verifikasi kredensial (menggantikan query Prisma langsung). Rate limiting LRU Cache tetap di frontend.
- **frontend/src/proxy.ts**: Mengaktifkan sebagai Next.js Middleware resmi (default export) untuk proteksi route.

### Frontend Server Actions & Route Handlers (BFF Proxies)

- **frontend/src/actions/regulations.ts**: Refaktorisasi Server Actions untuk mendelegasikan operasi regulasi ke REST API backend Express melalui `fetchFromBackend`.
- **frontend/src/actions/users.ts**: Refaktorisasi Server Actions untuk mendelegasikan operasi user ke REST API backend Express.
- **frontend/src/app/api/upload/route.ts**: Refaktorisasi menjadi BFF Proxy yang melakukan stream multipart upload ke backend dan mem-pipe SSE progress updates ke browser.
- **frontend/src/app/api/[...]/route.ts**: Refaktorisasi seluruh route handlers (`articles`, `db-status`, `judicial-reviews`, `regulations`, `seed`, `versions`, `reparse`, `reupload`, `manage`) menjadi thin proxy ke backend Express.
- **frontend/src/lib/data-service.ts**: Update fungsi data fetching untuk menggunakan `fetchFromBackend`.

### Backend Express REST API

- **backend/src/middleware/auth.ts** [NEW]: `authMiddleware` Express yang membaca header `X-User-Id` & `X-User-Role`, mengembalikan 401 jika header kosong dan 403 jika role bukan ADMIN.
- **backend/src/middleware/auth.test.ts** [NEW]: Unit tests untuk `authMiddleware`.
- **backend/src/routes/auth.ts** [NEW]: Router `POST /api/auth/login` untuk verifikasi email & password (bcrypt) dan mengembalikan profil user.
- **backend/src/routes/auth.test.ts** [NEW]: Unit tests untuk auth login route.
- **backend/src/routes/regulations.ts** [NEW]: REST endpoints untuk CRUD regulasi.
- **backend/src/routes/versions.ts** [NEW]: REST endpoints untuk manajemen versi dokumen.
- **backend/src/routes/articles.ts** [NEW]: REST endpoints untuk akses pasal.
- **backend/src/routes/article-changes.ts** [NEW]: REST endpoints untuk article diff/changes.
- **backend/src/routes/judicial-reviews.ts** [NEW]: REST endpoints untuk judicial reviews.
- **backend/src/routes/users.ts** [NEW]: REST endpoints untuk manajemen user.
- **backend/src/routes/seed.ts** [NEW]: REST endpoint untuk seeding database.
- **backend/src/routes/db-status.ts** [NEW]: REST endpoint untuk status koneksi database.
- **backend/src/routes/index.ts**: Update registrasi semua sub-routers baru ke main Express router.
- **backend/src/lib/judicial-review-search.ts** [NEW]: Helper untuk pencarian judicial review.
- **backend/src/lib/judicial-review.ts** [NEW]: Service layer untuk judicial review operations.
- **backend/src/utils/logger.ts** [NEW]: Logger utility untuk backend.
- **backend/src/utils/validations.ts** [NEW]: Shared validation helpers.

## Verification Plan

### Automated Tests
- Run `npm run test --workspace=backend` — semua 17 tests di 4 test files harus pass.

### Manual Verification
1. Run `npm run build` untuk memastikan TypeScript compilation berhasil tanpa error.
2. Run `npm run lint` untuk memastikan tidak ada lint errors.
3. Test login flow via frontend untuk memverifikasi NextAuth memanggil backend Express.
4. Test API calls dari frontend ke backend dengan user context headers.
