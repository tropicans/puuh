<!-- generated-by: gsd-doc-writer -->
# PUU Tracker — Peraturan Perundang-Undangan Tracker

A web application to track, compare, and analyze changes in Indonesian laws and regulations (Peraturan Perundang-Undangan - PUU).

## Fitur

- **Upload & parsing PDF** — Upload peraturan via PDF, auto-extract teks menggunakan layout-aware Docling microservice dengan multi-level fallback (pdfjs → pdf-parse → vision OCR).
- **Auto-fetch dari JDIH** — Ambil peraturan dari peraturan.bpk.go.id secara otomatis.
- **AI-powered article parsing** — Ekstrak pasal-pasal dari teks legal menggunakan LLM.
- **Perbandingan versi** — Bandingkan dua versi peraturan berdampingan dengan word-level diff.
- **Judicial Review tracking** — Lacak putusan MK/MA yang memengaruhi pasal.
- **Export PDF** — Generate laporan perbandingan.
- **Dark/light mode** — Full theme support.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI, NextAuth |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Storage | MinIO (S3-compatible) |
| AI/ML | OpenAI GPT models API, Docling layout extraction microservice |
| Testing | Vitest |

## Setup Lokal

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10.0.0
- Docker Desktop (untuk menjalankan database, MinIO, dan Docling-serve)

### Langkah Pemasangan & Menjalankan

1. Clone repositori ini:
   ```bash
   git clone <repo-url>
   cd puu
   ```

2. Pasang semua dependensi monorepo:
   ```bash
   npm ci
   ```

3. Jalankan infrastruktur pendukung menggunakan Docker Compose:
   ```bash
   docker compose up -d postgres minio docling-serve
   ```

4. Konfigurasi berkas environment:
   Salin `.env.example` ke `.env` di dalam folder `frontend/` dan `backend/`, lalu sesuaikan variabelnya.

5. Jalankan migrasi basis data dan seeding dari root workspace:
   ```bash
   npm run db:migrate
   ```

6. Jalankan server pengembangan (dev) untuk frontend dan backend secara simultan:
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:3006`, sedangkan backend API berjalan di `http://localhost:3007`.

## Docker (Full Stack)

Anda dapat menjalankan seluruh stack monorepo (termasuk frontend dan backend) di dalam kontainer Docker:
```bash
docker compose up --build
```

## Credentials Bootstrap

Untuk membuat admin user pertama kali, konfigurasi variabel berikut di `.env` backend:
```env
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_PASSWORD="min-12-character-password"
```
Jalankan seeder untuk mengisi data awal:
```bash
npm run db:seed
```

## Scripts

Perintah-perintah berikut dapat dijalankan dari direktori root monorepo:

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan frontend dan backend secara simultan dalam mode dev |
| `npm run build` | Melakukan build untuk seluruh workspace (frontend & backend) |
| `npm run lint` | Melakukan pemeriksaan linting pada semua workspace |
| `npm run test` | Menjalankan seluruh rangkaian unit testing menggunakan Vitest |
| `npm run smoke` | Menjalankan pengujian akhir E2E smoke test (`scripts/smoke-flow.mjs`) |
| `npm run db:generate` | Menghasilkan Prisma client untuk backend dan frontend |
| `npm run db:migrate` | Melakukan Prisma migration deploy dan database seeding |
| `npm run db:studio` | Membuka Prisma Studio untuk backend database |

## Lisensi

Private — internal use.
