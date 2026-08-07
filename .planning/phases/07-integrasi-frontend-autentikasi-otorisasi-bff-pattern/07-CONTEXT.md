# Phase 7: Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern) - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Menghubungkan halaman UI Next.js ke REST API Express, memigrasi login credentials provider NextAuth agar melakukan verifikasi via endpoint backend Express, serta mengimplementasikan pengiriman konteks user (`X-User-Id`, `X-User-Role`) dan pengamanan route via Next.js Middleware.

</domain>

<decisions>
## Implementation Decisions

### BFF Routing & Next.js API/Action Proxying
- **D-01:** Server Actions di Next.js bertindak sebagai BFF (Backend-For-Frontend) proxy yang melakukan request HTTP (fetch) server-side ke Express backend. Ini menjaga agar port Express backend tetap privat dan tidak diekspos ke client browser, serta mendukung Server-Side Rendering (SSR).
- **D-02:** Proses upload file PDF dilakukan dengan mengirimkan file sebagai `multipart/form-data` dari client ke Next.js Route Handler `/api/upload`, yang kemudian meneruskan file stream ke Express backend di port 3007 (`/api/upload`).
- **D-03:** Route Handlers non-upload yang ada di Next.js (seperti `/api/versions/[id]/reparse`, dll.) dipertahankan sebagai BFF Proxy tipis yang meneruskan request ke Express backend guna meminimalkan perubahan kode UI.
- **D-04:** Revalidasi data dilakukan secara lokal di Next.js menggunakan `revalidatePath()` setelah Server Action menerima respons sukses dari Express backend.

### Pengiriman Konteks User via Header & Otorisasi Express
- **D-05:** Express backend memvalidasi dan mengidentifikasi konteks user menggunakan custom Express middleware (`authMiddleware`) yang membaca header `X-User-Id` dan `X-User-Role` yang dikirim dari Next.js.
- **D-06:** Jika otorisasi gagal di Express backend (misal, request ke endpoint admin tanpa header yang valid), backend mengembalikan status `401 Unauthorized` jika header kosong/tidak ada, dan `403 Forbidden` jika role bukan `ADMIN`.

### Autentikasi NextAuth & Login di Express
- **D-07:** Verifikasi login NextAuth credentials provider dilakukan dengan melakukan request `POST /api/auth/login` ke Express backend. Express backend memverifikasi email & password (menggunakan bcrypt) lalu mengembalikan profil user `{ id, email, name, role }`.
- **D-08:** Perlindungan rate limiting untuk percobaan login gagal tetap ditangani di Next.js frontend menggunakan LRU cache yang sudah ada.

### Aktivasi Next.js Middleware untuk Proteksi Route
- **D-09:** Aturan proteksi route dalam `frontend/src/proxy.ts` diaktifkan sebagai Next.js Middleware resmi dengan membuat file `frontend/src/middleware.ts` baru yang mengekspor fungsi `proxy` sebagai default middleware.

### the agent's Discretion
- Pengaturan timeout fetch request dari BFF Next.js ke Express backend.
- Struktur parser error di Next.js ketika memformat respons error dari backend ke format ramah pengguna di UI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` — Rencana fase proyek, jadwal, dan kriteria sukses.
- `.planning/REQUIREMENTS.md` — Daftar kebutuhan fungsional dan teknis (FE-01, FE-02, FE-03, AUTH-01, AUTH-02).
- `frontend/src/lib/auth.ts` — Konfigurasi NextAuth credentials provider saat ini yang perlu dimigrasi.
- `frontend/src/proxy.ts` — Aturan proteksi route yang akan diaktifkan via middleware.
- `backend/src/routes/upload.ts` — Endpoint upload backend Express saat ini yang memerlukan otorisasi.
- `backend/src/lib/prisma.ts` — Koneksi Prisma client di backend yang akan digunakan oleh endpoint auth/login baru.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/proxy.ts`: Berisi aturan deteksi route dan session role parsing.
- `frontend/src/lib/auth.ts`: Berisi login schema dan LRU Cache rate-limiting.
- `backend/src/lib/prisma.ts`: Digunakan oleh backend untuk querying database.

### Established Patterns
- BFF pattern: Next.js server-side functions (Server Actions & Route Handlers) bertindak sebagai perantara aman ke Express API.
- Error wrapping: Action result format `{ success: boolean, data?: T, error?: string }` di Server Actions untuk merespons UI secara aman.

### Integration Points
- `frontend/src/middleware.ts` baru terhubung dengan `frontend/src/proxy.ts`.
- `frontend/src/lib/auth.ts` terhubung dengan endpoint `POST /api/auth/login` (atau `/api/users/login`) baru di Express.
- Endpoint baru di Express `POST /api/auth/login` terhubung dengan `prisma` dan `bcryptjs`.
- `authMiddleware` di Express disematkan ke endpoint `/api/upload` dan endpoint modifikasi regulasi lainnya.

</code_context>

<specifics>
## Specific Ideas

- URL Backend didefinisikan via environment variable `BACKEND_URL` (misal `http://localhost:3007` untuk dev, `http://backend:3007` untuk Docker compose).

</specifics>

<deferred>
## Deferred Ideas

- Sinkronisasi session token yang terenkripsi penuh antara Express backend dan Next.js (tidak diperlukan karena komunikasi internal BFF menggunakan headers).

</deferred>

---

*Phase: 7-Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern)*
*Context gathered: 2026-08-07*
