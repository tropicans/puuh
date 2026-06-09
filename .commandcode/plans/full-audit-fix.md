# Full Audit Fix Plan — PUU Tracker

## Overview
27 temuan dari 3 level prioritas (CRITICAL: 6, HIGH: 9, MEDIUM: 12). Plan ini mencakup semua perbaikan dalam urutan eksekusi yang aman.

---

## PHASE 1: SECRETS & SECURITY BASELINE (CRITICAL #1,5 — HIGH #7,8,9,11,12)

### 1.1 Rotasi & Bersihkan Secrets
**Target**: `.env` di-git, `.env.example` tidak ada, credentials default

**Langkah**:
1. Buat `.env.example` dengan semua variabel tanpa nilai asli:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5434/puu_tracker?schema=public"
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://your-proxy.example.com/v1"
OPENAI_MODEL="your-model-name"
NEXT_PUBLIC_APP_NAME="PUU Tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_VISION_API_KEY="..."
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3006"
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="puu-documents"
```
2. `git rm --cached .env` — hapus dari tracking
3. Verifikasi `.gitignore` sudah memiliki `.env*` (sudah ada ✅)
4. Generate `AUTH_SECRET` baru: `openssl rand -base64 32` atau `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`
5. Update `docker-compose.yml`:
   - Ganti `DATABASE_URL=postgresql://puu_admin:puu123@...` → `DATABASE_URL=${DATABASE_URL}`
   - Ganti `POSTGRES_PASSWORD=puu123` → `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`
   - Tambahkan env var `POSTGRES_USER` → `${POSTGRES_USER}`

### 1.2 Buat `.dockerignore`
```
.env
.env.*
node_modules
.git
.gitignore
.next
.agent
.commandcode
.planning
*.md
!README.md
scripts/
prisma/migrations
```
**Reason**: Mencegah `.env` dan junk masuk Docker build context.

### 1.3 HEALTHCHECK di Dockerfile
Tambahkan sebelum `CMD`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/db-status || exit 1
```

### 1.4 HEALTHCHECK di docker-compose untuk PostgreSQL & MinIO
```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-puu_admin} -d puu_tracker"]
    interval: 10s
    timeout: 5s
    retries: 5
    
minio:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 10s
    timeout: 5s
    retries: 5

app:
  depends_on:
    postgres:
      condition: service_healthy
    minio:
      condition: service_healthy
```

---

## PHASE 2: AUTHORIZATION & RATE LIMITING (CRITICAL #2,3 — HIGH #?)

### 2.1 Tambah Authorization di Server Actions
**Files**: `src/actions/regulations.ts`, `src/actions/users.ts`

Tambahkan helper di atas file:
```typescript
import { getCurrentUser, isAdminRole } from '@/lib/authorization';

async function requireAdmin(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (!isAdminRole(user.role)) throw new Error('Forbidden');
}

function wrapAdminAction<T extends (...args: any[]) => Promise<ActionResult<any>>>(fn: T): T {
    return (async (...args: Parameters<T>) => {
        try {
            await requireAdmin();
        } catch (e: any) {
            return { success: false, error: e.message === 'Forbidden' ? 'Akses ditolak' : 'Silakan login terlebih dahulu' };
        }
        return fn(...args);
    }) as T;
}
```

Wrap semua fungsi mutation (create/update/delete) dengan `wrapAdminAction`. Fungsi read-only tidak perlu di-wrap.

**Mutasi di `regulations.ts` yang perlu di-protect**:
- `createRegulationType`
- `createRegulation`
- `deleteRegulation`
- `createVersion`
- `updateVersionStatus`
- `createArticles`
- `createArticleChange`
- `seedInitialData`
- `checkDatabaseConnection`

**Mutasi di `users.ts`**:
- `seedAdminUser`
- `getUsers`

### 2.2 Rate Limiting di Semua Endpoint + Login
**Files**: `src/lib/rate-limit.ts`

Refactor rate-limiter agar bisa di-apply secara generik:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

type RateLimitConfig = {
    interval: number;       // ms
    maxRequests: number;    // max requests in interval
    uniqueTokenPerInterval?: number;
};

export function createRateLimiter(config: RateLimitConfig) {
    const cache = new LRUCache<string, number[]>({
        max: config.uniqueTokenPerInterval || 500,
        ttl: config.interval,
    });

    return {
        async check(req: NextRequest): Promise<{ limited: boolean; remaining: number }> {
            const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
            const tokenCount = cache.get(ip) || [0];
            
            if (tokenCount[0] === 0) cache.set(ip, tokenCount);
            tokenCount[0] += 1;
            
            const currentUsage = tokenCount[0];
            const limited = currentUsage > config.maxRequests;
            const remaining = Math.max(0, config.maxRequests - currentUsage);
            
            return { limited, remaining };
        }
    };
}

// Preset limiters
export const authLimiter = createRateLimiter({ interval: 60_000, maxRequests: 5 });   // 5 login/min
export const apiLimiter = createRateLimiter({ interval: 60_000, maxRequests: 30 });     // 30 req/min
export const uploadLimiter = createRateLimiter({ interval: 60_000, maxRequests: 10 });  // 10 upload/min
export const adminLimiter = createRateLimiter({ interval: 60_000, maxRequests: 60 });  // 60 admin req/min
```

**Terapkan di**:
- `src/app/api/auth/[...nextauth]/route.ts` — `authLimiter` untuk POST credentials
- Semua `src/app/api/**/route.ts` — `apiLimiter` atau `adminLimiter` sesuai endpoint
- `src/app/login/page.tsx` — client-side rate limit feedback (opsional, server-side sudah cukup)

### 2.3 Rate Limit pada Login (Brute-Force Protection)
Tambahkan ke `src/app/api/auth/[...nextauth]/route.ts` atau di `src/lib/auth.ts` di dalam `authorize()`:
- Track login attempts per IP + email
- Return generic error tanpa membedakan "user not found" vs "wrong password"
- Lockout setelah 5 failed attempts dalam 15 menit

Implementasi: extend `auth.ts` — di dalam `authorize()`:
```typescript
const failedAttempts = await rateLimitCache.get(`login:${ip}:${email}`);
if (failedAttempts >= 5) throw new CredentialsSignin("Terlalu banyak percobaan");
// ... after failed compare
rateLimitCache.set(`login:${ip}:${email}`, (failedAttempts || 0) + 1);
```

---

## PHASE 3: INPUT VALIDATION & UPLOAD SECURITY (CRITICAL #4,6)

### 3.1 MIME Type & File Extension Validation
**File**: `src/app/api/upload/route.ts`

Setelah menerima file, tambahkan:
```typescript
const ALLOWED_MIMES = ['application/pdf'];
const MAX_SIZE_MB = 20;

// MIME type check
if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({
        success: false,
        message: 'Hanya file PDF yang diterima'
    }, { status: 400 });
}

// File extension check
const fileName = file.name.toLowerCase();
if (!fileName.endsWith('.pdf')) {
    return NextResponse.json({
        success: false,
        message: 'Ekstensi file harus .pdf'
    }, { status: 400 });
}
```

### 3.2 Content-Security-Policy Header
**File**: `next.config.ts`

Tambahkan CSP header setelah `Permissions-Policy`:
```typescript
{
    key: 'Content-Security-Policy',
    value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https:",  // untuk proxy LLM calls
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ')
}
```

Juga ganti:
```
X-DNS-Prefetch-Control: on  →  X-DNS-Prefetch-Control: off
```

---

## PHASE 4: CODE QUALITY & DEAD CODE (HIGH #10,14 — MEDIUM #16,17,18,19,20,21)

### 4.1 Pin @opengsd/gsd-core
**File**: `package.json`

Ubah:
```json
"@opengsd/gsd-core": "github:open-gsd/gsd-core"
```
Ke commit/pin spesifik:
```json
"@opengsd/gsd-core": "github:open-gsd/gsd-core#<commit-hash>"
```

### 4.2 Structured Logger
Buat `src/lib/logger.ts`:
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
    debug(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('debug')) console.debug(formatMessage('debug', msg, meta));
    },
    info(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('info')) console.info(formatMessage('info', msg, meta));
    },
    warn(msg: string, meta?: Record<string, unknown>) {
        if (shouldLog('warn')) console.warn(formatMessage('warn', msg, meta));
    },
    error(msg: string, error?: unknown, meta?: Record<string, unknown>) {
        if (shouldLog('error')) {
            const errObj = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
            console.error(formatMessage('error', msg, { error: errObj, ...meta }));
        }
    }
};
```

Replace semua `console.log`/`console.error` di file:
- `src/actions/regulations.ts` (~12 calls)
- `src/actions/users.ts` (~2 calls)
- `src/app/api/**/route.ts` (~30+ calls)
- `src/lib/*.ts` (~40+ calls)
- `src/proxy.ts` (~1 call)

### 4.3 Hapus Dead Code
1. **`src/lib/dummy-data.ts`** — Hapus file. Cek apakah ada import yang masih merujuk:
   - `src/app/dashboard/page.tsx` — ada `import type { Regulation } from '@/lib/dummy-data'` → ubah ke tipe lokal atau dari Prisma
2. **`src/components/dashboard/`** — Cek apakah `RegulationSection.tsx`, `StatsSection.tsx` digunakan. Jika tidak → hapus.
3. **`src/components/search/RegulationFilters.tsx`**, `SearchInput.tsx` — Cek apakah digunakan terpisah. Jika hanya melalui `UnifiedSearchBar` → hapus jika tidak di-import langsung.
4. **`/design` route** — Jika identik dengan `/`, redirect atau hapus.
5. **Duplikasi landing page** — `/` dan `/design` render komponen sama.

### 4.4 Konsolidasi Types
Buat `src/lib/types.ts`:
```typescript
// Re-use Prisma types
export type { Regulation, RegulationVersion, Article, RegulationType } from '@prisma/client';

// UI-friendly interfaces
export interface RegulationListItem {
    id: string;
    title: string;
    description: string | null;
    type: { id: string; shortName: string; name: string };
    _count: { versions: number };
    versions: { articleCount: number; status: string }[];
    createdAt: Date;
}

export interface VersionWithArticles {
    id: string;
    number: string;
    year: number;
    fullTitle: string;
    effectiveDate: Date | null;
    status: string;
    rawText: string | null;
    originalFileUrl: string | null;
    amendsId: string | null;
    articles: ArticleWithStatus[];
}

export interface ArticleWithStatus {
    id: string;
    articleNumber: string;
    content: string;
    status: string;
    orderIndex: number;
}
```

Update semua file yang mendefinisikan tipe sendiri:
- `src/app/compare/page.tsx`
- `src/app/regulations/[id]/page.tsx`
- `src/app/manage/page.tsx`
- `src/app/manage/version/[id]/page.tsx`
- `src/app/dashboard/page.tsx`

### 4.5 Konsolidasi Transform Logic
Pilih `src/lib/transformers.ts` sebagai single source of truth. Hapus duplikasi inline di:
- `src/app/dashboard/page.tsx`
- `src/app/regulations/[id]/page.tsx`
- `src/app/compare/page.tsx`

Import dari `@/lib/transformers` saja.

### 4.6 Pindahkan landing-page.tsx
Dari `src/components/ui/landing-page.tsx` → `src/components/landing/landing-page.tsx`

### 4.7 Tambah error.tsx / loading.tsx Boundaries
- `src/app/dashboard/error.tsx`
- `src/app/compare/error.tsx`
- `src/app/regulations/[id]/error.tsx`
- `src/app/dashboard/loading.tsx`

### 4.8 Bersihkan Hardcoded LLM Proxy URL
**Files**: `src/lib/ai-service.ts`, `src/lib/ocr-service.ts`, `src/lib/regulation-fetcher.ts`

Semua fallback default `https://proxy.kelazz.my.id/v1` → wajib dari env var. Jika env var tidak ada, return error yang jelas alih-alih fallback diam-diam:
```typescript
const baseUrl = process.env.OPENAI_BASE_URL;
if (!baseUrl) throw new Error('OPENAI_BASE_URL not configured');
```

---

## PHASE 5: DATABASE & TRANSACTION FIXES (HIGH #15 — MEDIUM #22,23,24,25,26)

### 5.1 Full-Text Search Index
**File**: Prisma schema + migration

Tambahkan extension dan index:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_version_rawtext_trgm ON "RegulationVersion" USING gin ("rawText" gin_trgm_ops);
```

Atau gunakan tsvector:
```sql
ALTER TABLE "RegulationVersion" ADD COLUMN "searchText" tsvector 
  GENERATED ALWAYS AS (to_tsvector('indonesian', COALESCE("fullTitle", '') || ' ' || COALESCE("rawText", ''))) STORED;
CREATE INDEX idx_version_search ON "RegulationVersion" USING gin ("searchText");
```

Update query di `data-service.ts` untuk menggunakan `searchText`:
```typescript
if (q) {
    where.versions = {
        some: {
            searchText: { search: q }
        }
    };
}
```

### 5.2 Transaction di createVersion
**File**: `src/actions/regulations.ts`

Wrap dalam `$transaction`:
```typescript
const version = await prisma.$transaction(async (tx) => {
    if (data.amendsId) {
        await tx.regulationVersion.update({
            where: { id: data.amendsId },
            data: { status: 'AMENDED' }
        });
    }
    return tx.regulationVersion.create({ data: { ...data, status: 'ACTIVE' }, include: { regulation: true } });
});
```

### 5.3 Transaction di JR Sync
**File**: `src/app/api/regulations/[id]/judicial-reviews/sync/route.ts`

Wrap loop processing candidates dalam `$transaction`. Batch create/update operations.

### 5.4 Tambah Composite Indexes
Migration baru:
```sql
CREATE INDEX idx_version_reg_status ON "RegulationVersion" ("regulationId", "status");
CREATE INDEX idx_version_status ON "RegulationVersion" ("status");
CREATE INDEX idx_article_version_status ON "Article" ("versionId", "status");
CREATE INDEX idx_article_version_order ON "Article" ("versionId", "orderIndex");
CREATE INDEX idx_jr_impact_case_disposition ON "JudicialReviewImpact" ("caseId", "disposition");
CREATE INDEX idx_regulation_type_created ON "Regulation" ("typeId", "createdAt" DESC);
```

### 5.5 Tambah Audit Columns (MEDIUM #26)
Prisma migration — tambahkan ke semua model:
```prisma
model Regulation {
    // ... existing fields
    createdById String? 
    updatedById String?
    createdBy   User?   @relation("CreatedRegulations", fields: [createdById], references: [id])
    updatedBy   User?   @relation("UpdatedRegulations", fields: [updatedById], references: [id])
}
```
(Repeat untuk RegulationVersion, Article)

Update User model untuk menambahkan inverse relations.

### 5.6 Koneksi Pool Configuration
**File**: `src/lib/prisma.ts`

```typescript
const connectionPool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});
```

### 5.7 Tambah Soft Delete (MEDIUM #25)
Tambahkan `deletedAt DateTime?` ke model: `Regulation`, `RegulationVersion`, `Article`

Update semua query untuk filter `deletedAt: null`:
```typescript
// Di Prisma client middleware
prisma.$use(async (params, next) => {
    // Soft delete filtering bisa dilakukan di sini untuk query otomatis
});
```

Atau pendekatan lebih sederhana: tambahkan `where: { deletedAt: null }` di semua query yang relevan.

---

## PHASE 6: TEST INFRASTRUCTURE (CRITICAL #5)

### 6.1 Setup Vitest
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

### 6.2 Konfigurasi
`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

### 6.3 Test Pertama — Coverage Minimum
Prioritas test:
1. **`src/lib/auth.ts`** — `authorize()` function (credentials validation)
2. **`src/lib/validations.ts`** — Semua Zod schemas
3. **`src/lib/diff-engine.ts`** — LCS diff algorithm
4. **`src/lib/authorization.ts`** — `isAdminRole()`
5. **`src/lib/transformers.ts`** — `transformRegulation()`
6. **`src/lib/utils.ts`** — Utility functions

### 6.4 Update package.json
```json
{
    "scripts": {
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage"
    }
}
```

---

## PHASE 7: README & DOCUMENTATION (MEDIUM #27)

### 7.1 Rewrite README.md
Hapus boilerplate create-next-app. Isi dengan:
- **Apa itu PUU Tracker** — tracker perubahan peraturan perundang-undangan Indonesia
- **Fitur utama** — upload PDF, auto-fetch JDIH, OCR, AI parsing, perbandingan versi, judicial review tracking
- **Tech stack** — Next.js 16, React 19, Prisma 7, PostgreSQL, MinIO, Auth.js
- **Setup lokal** — `cp .env.example .env`, `npm ci`, `docker compose up`, `npx prisma generate`, `npm run dev`
- **Arsitektur** — diagram singkat
- **Credentials default** — admin bootstrap via env vars

---

## PHASE 8: PACKAGE.PY ADDITIONAL SCRIPTS (HIGH #?)

### 8.1 Tambah Scripts
```json
{
    "scripts": {
        "dev": "next dev -p 3006",
        "build": "next build",
        "start": "next start",
        "lint": "eslint",
        "format": "eslint --fix .",
        "smoke": "node scripts/smoke-flow.mjs",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "db:migrate": "npx prisma migrate dev",
        "db:push": "npx prisma db push",
        "db:seed": "npx prisma db seed",
        "db:studio": "npx prisma studio"
    },
    "prisma": {
        "seed": "npx tsx prisma/seed.ts"
    }
}
```

---

## VERIFICATION

Setelah semua phase, jalankan:

```bash
# 1. Build
npm run build

# 2. Lint
npm run lint

# 3. Tests
npm test

# 4. Smoke
npm run smoke

# 5. Docker
docker compose build
docker compose up -d
docker compose ps  # semua healthy
docker compose logs app  # tidak ada error

# 6. Security check
# - GET /api/regulations tanpa login → redirect ke /login ✅
# - POST /api/upload tanpa admin → 403 ✅
# - Login brute force → rate limited setelah 5x ✅
# - Upload file .exe rename ke .pdf → rejected ✅
# - curl -I http://localhost:3006 → ada CSP header ✅
# - git ls-files .env → kosong (tidak tracked) ✅
```
