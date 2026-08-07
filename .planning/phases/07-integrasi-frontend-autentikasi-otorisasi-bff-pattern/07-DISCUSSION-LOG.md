# Phase 7: Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-07
**Phase:** 7-Integrasi Frontend & Autentikasi/Otorisasi (BFF Pattern)
**Areas discussed:** BFF Routing & Next.js API/Action Proxying, Pengiriman Konteks User via Header & Otorisasi Express, Autentikasi NextAuth & Login di Express, Aktivasi Next.js Middleware untuk Proteksi Route

---

## BFF Routing & Next.js API/Action Proxying

| Option | Description | Selected |
|--------|-------------|----------|
| Server Actions (BFF) | Server Actions (BFF) melakukan fetch HTTP server-side ke Express backend. (Mendukung SSR penuh, aman, tidak mengekspos port backend). | ✓ |
| Route Handlers Proxy | Route Handlers (app/api/*) bertindak sebagai API Proxy tipis yang meneruskan request ke Express backend. | |
| Client-side CORS Fetch | Client-side fetch langsung dari React components ke Express backend (port 3007) via CORS. | |

**User's choice:** Server Actions (BFF) melakukan fetch HTTP server-side ke Express backend.
**Notes:** Menjaga agar port Express backend tetap privat dan aman.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js BFF Upload Proxy | Form mengirim multipart/form-data ke Next.js Route Handler (/api/upload), yang kemudian meneruskan file stream ke Express backend (/api/upload). (Tetap menjaga Next.js sebagai BFF untuk upload). | ✓ |
| Direct client upload to Express | Client-side upload langsung mengirim file PDF dari browser ke Express backend (/api/upload) menggunakan CORS. | |

**User's choice:** Form mengirim multipart/form-data ke Next.js Route Handler (/api/upload), yang kemudian meneruskan file stream ke Express backend (/api/upload).
**Notes:** Menghindari eksposur port upload backend langsung ke client browser.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Retain existing Route Handlers as Proxy | Pertahankan Route Handlers tersebut sebagai BFF Proxy yang meneruskan request ke Express backend. (Meminimalkan perubahan kode UI yang memanggil endpoint tersebut). | ✓ |
| Hapus Route Handlers | Hapus Route Handlers dan migrasikan seluruh interaksi data di frontend menggunakan Server Actions. | |

**User's choice:** Pertahankan Route Handlers tersebut sebagai BFF Proxy yang meneruskan request ke Express backend.
**Notes:** Mengurangi cakupan pengerjaan ulang pada UI yang telah ada.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server Action revalidatePath | Server Actions Next.js yang memanggil mutasi Express akan menjalankan revalidatePath() setelah mendapat response sukses dari backend. | ✓ |
| Express webhook revalidation | Express backend memicu revalidation di Next.js secara dinamis via API revalidation endpoint. | |

**User's choice:** Server Actions Next.js yang memanggil mutasi Express akan menjalankan revalidatePath() setelah mendapat response sukses dari backend.
**Notes:** Memanfaatkan kapabilitas native Next.js server-side secara langsung.

---

## Pengiriman Konteks User via Header & Otorisasi Express

| Option | Description | Selected |
|--------|-------------|----------|
| Custom Express Middleware | Gunakan Custom Express Middleware (authMiddleware) untuk membaca header X-User-Id dan X-User-Role yang dikirim Next.js. (Sangat cepat, aman di internal network). | ✓ |
| Call back to session endpoint | Express backend memverifikasi session token dengan melakukan HTTP call balik ke Next.js session endpoint (/api/auth/session). | |

**User's choice:** Gunakan Custom Express Middleware (authMiddleware) untuk membaca header X-User-Id dan X-User-Role yang dikirim Next.js.
**Notes:** Menghindari overhead network call tambahan untuk setiap validasi request.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Status 401 & 403 | Kembalikan 401 Unauthorized jika header kosong, dan 403 Forbidden jika header berisi role selain ADMIN. (Standar industri yang jelas). | ✓ |
| Status 401 for all | Kembalikan 401 Unauthorized untuk semua jenis kesalahan/ketiadaan otorisasi. | |

**User's choice:** Kembalikan 401 Unauthorized jika header kosong, dan 403 Forbidden jika header berisi role selain ADMIN.
**Notes:** Memisahkan kasus ketiadaan token autentikasi (401) dengan kegagalan hak akses role (403).

---

## Autentikasi NextAuth & Login di Express

| Option | Description | Selected |
|--------|-------------|----------|
| Express Auth Login Endpoint | NextAuth memanggil endpoint POST /api/auth/login di Express backend. Express backend memverifikasi email & password (menggunakan bcrypt) lalu mengembalikan profil user. | ✓ |
| Next.js Local verification | Next.js mengambil data user dari Express backend via API, lalu memverifikasi password secara lokal di Next.js server menggunakan bcrypt. | |

**User's choice:** NextAuth memanggil endpoint POST /api/auth/login di Express backend. Express backend memverifikasi email & password (menggunakan bcrypt) lalu mengembalikan profil user.
**Notes:** Menghindari manipulasi verifikasi hash password di sisi frontend BFF.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Rate limit on Next.js | Tetap pertahankan rate limiting di Next.js frontend (menggunakan LRU cache yang sudah ada). (Mengurangi beban request ke backend Express). | ✓ |
| Rate limit on Express | Pindahkan/migrasikan logika rate limiting ke Express backend (misal menggunakan express-rate-limit). | |

**User's choice:** Tetap pertahankan rate limiting di Next.js frontend (menggunakan LRU cache yang sudah ada).
**Notes:** Menolak percobaan brute-force sedini mungkin sebelum mencapai backend utama.

---

## Aktivasi Next.js Middleware untuk Proteksi Route

| Option | Description | Selected |
|--------|-------------|----------|
| Create src/middleware.ts | Buat file frontend/src/middleware.ts baru yang hanya meng-export fungsi proxy dari proxy.ts (misal: export { proxy as default, config } from './proxy'). | ✓ |
| Rename proxy.ts | Ubah nama file frontend/src/proxy.ts menjadi frontend/src/middleware.ts secara langsung dan sesuaikan export-nya. | |

**User's choice:** Buat file frontend/src/middleware.ts baru yang hanya meng-export fungsi proxy dari proxy.ts (misal: export { proxy as default, config } from './proxy').
**Notes:** Menjaga keterbacaan kode antara konfigurasi Next.js middleware dan logika route proxy.

---

## the agent's Discretion

- Pengaturan timeout fetch request dari BFF Next.js ke Express backend.
- Struktur parser error di Next.js ketika memformat respons error dari backend ke format ramah pengguna di UI.

## Deferred Ideas

- Sinkronisasi session token yang terenkripsi penuh antara Express backend dan Next.js (tidak diperlukan karena komunikasi internal BFF menggunakan headers).
