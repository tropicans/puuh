# PUU Tracker — Peraturan Perundang-Undangan Tracker

Aplikasi untuk melacak, membandingkan, dan menganalisis perubahan peraturan perundang-undangan Indonesia.

## Fitur

- **Upload & parsing PDF** — upload peraturan via PDF, auto-extract teks dengan chain pdfjs → pdf-parse → Gemini Vision OCR
- **Auto-fetch dari JDIH** — ambil peraturan dari peraturan.bpk.go.id secara otomatis
- **AI-powered article parsing** — ekstrak pasal-pasal dari teks legal menggunakan LLM
- **Perbandingan versi** — bandingkan dua versi peraturan berdampingan dengan word-level diff
- **Judicial Review tracking** — lacak putusan MK/MA yang memengaruhi pasal
- **Export PDF** — generate laporan perbandingan
- **Dark/light mode** — full theme support

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| Storage | MinIO (S3-compatible) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI/ML | OpenAI-compatible LLM proxy, Gemini Vision |

## Setup Lokal

```bash
# 1. Clone dan install
git clone <repo-url>
cd puu
npm ci

# 2. Konfigurasi environment
cp .env.example .env
# Edit .env — isi semua variabel yang diperlukan

# 3. Generate Prisma client
npx prisma generate

# 4. Jalankan database & MinIO
docker compose up -d postgres minio

# 5. Push schema & seed
npm run db:migrate
npm run db:seed

# 6. Dev server
npm run dev
# Buka http://localhost:3006
```

## Docker (Full Stack)

```bash
cp .env.example .env  # isi semua variabel
docker compose up --build
```

## Credentials Bootstrap

Untuk membuat admin user pertama kali, set env vars:

```env
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_PASSWORD="min-12-character-password"
```

Lalu jalankan `POST /api/seed` dengan header `x-bootstrap-token: puu-seed` (hanya berlaku saat tidak ada user di database).

## Scripts

| Script | Perintah |
|---|---|
| `npm run dev` | Dev server (port 3006) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint |
| `npm run format` | ESLint auto-fix |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest watch mode |
| `npm run smoke` | Smoke test (HTTP checks) |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:push` | Prisma db push |
| `npm run db:seed` | Prisma seed |
| `npm run db:studio` | Prisma Studio |

## Arsitektur

```
src/
  actions/          Server Actions (CRUD mutations)
  app/api/          REST API routes + streaming endpoints
  app/              Next.js App Router pages
  components/       UI, layout, feature components
  hooks/            Client hooks (useAsyncAction, useFlashMessage)
  lib/              Shared services (auth, db, AI, storage, validations)
  __tests__/        Test files
```

## Lisensi

Private — internal use.
