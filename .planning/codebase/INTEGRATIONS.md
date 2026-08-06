# External Integrations

**Analysis Date:** 2026-06-10

## APIs & External Services

**LLM / AI Services:**
- Custom LLM Proxy (`https://sembilan.kelazz.my.id/v1`) - OpenAI-compatible API for AI-powered text processing
  - SDK/Client: Direct `fetch()` calls to `/chat/completions` endpoint
  - Auth: `Authorization: Bearer ${OPENAI_API_KEY}` header
  - Uses: Article parsing, change analysis, version summaries

**Google Vision API:**
- OCR for scanned PDFs (alternative to LLM-based OCR)
  - SDK/Client: Direct `fetch()` calls
  - Auth: API key as query parameter or header
  - Uses: Text extraction from image-based PDF documents

## Data Storage

**Databases:**
- PostgreSQL 15 (via Docker)
  - Connection: `DATABASE_URL` env var (e.g., `postgresql://puu_admin:puu123@localhost:5434/puu_tracker?schema=public`)
  - Client: Prisma ORM with `@prisma/adapter-pg` + Node.js `pg` pool
  - Schema: `prisma/schema.prisma` - defines Regulation, RegulationVersion, Article, JudicialReviewCase models

**File Storage:**
- MinIO (self-hosted S3-compatible object storage)
  - SDK/Client: `minio` npm package
  - Connection: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Bucket: `puu-documents`
  - Uses: Storing original PDF files for regulation versions

**Caching:**
- LRU Cache (`lru-cache` 11.2.5) - In-memory caching for rate limiting and temporary data

## Authentication & Identity

**Auth Provider:**
- Custom (NextAuth.js credentials provider)
  - Implementation: `src/lib/auth.ts`
  - Approach: Email/password with bcryptjs hashing, JWT session strategy
  - Rate limiting: 5 failed attempts per 15 minutes per email+IP
  - Role-based access: ADMIN, VIEWER roles

## Monitoring & Observability

**Error Tracking:**
- None - Custom console-based logging in `src/lib/logger.ts`

**Logs:**
- Approach: Structured console logging with levels (debug, info, warn, error)
  - Timestamps in ISO format
  - Meta object support for JSON serialization
  - Log level controlled via `LOG_LEVEL` env var or NODE_ENV

## CI/CD & Deployment

**Hosting:**
- Docker Compose (app, postgres, minio services)
- Local development: `npm run dev` on port 3006
- Production: Standalone Next.js output (`npm run start`)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth session signing secret
- `NEXTAUTH_URL` - Auth callback URL
- `OPENAI_API_KEY` - LLM provider API key
- `OPENAI_BASE_URL` - LLM provider base URL
- `OPENAI_MODEL` - Model name for LLM calls
- `GOOGLE_VISION_API_KEY` - OCR service key
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - Storage credentials
- `MINIO_BUCKET_NAME` - Storage bucket
- `BOOTSTRAP_SEED_TOKEN` - One-time admin initialization token
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` - Initial admin account

**Secrets location:**
- `.env` file (root directory) - Never committed to git
- Docker Compose passes secrets via environment variables

## Webhooks & Callbacks

**Incoming:**
- NextAuth callback route: `/api/auth/[...nextauth]`
- Seed endpoint: `/api/seed` (requires bootstrap token)
- Regulation fetch: `/api/regulations/fetch`
- Upload endpoints: `/api/upload`, `/api/versions/[id]/reupload`

**Outgoing:**
- LLM API: `POST /chat/completions` to custom proxy
- MinIO: Object storage operations (PUT, GET, DELETE)
- PostgreSQL: Direct queries via Prisma

---

*Integration audit: 2026-06-10*
