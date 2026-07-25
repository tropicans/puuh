# External Integrations

**Analysis Date:** 2026-07-25

## APIs & External Services

**Indonesian Law API (Pasal.id):**
- Pasal.id - Used for fetching Indonesian legislation versions, metadata, and contents.
  - SDK/Client: REST API integrations via `fetch` (implemented in `src/lib/regulation-fetcher.ts`)
  - Auth: API token in `PASAL_ID_TOKEN` env var
  - Endpoints: Searches and fetches PDF files and law texts directly from Pasal.id repositories

**LLM API (Custom Proxy):**
- 9router Custom OpenAI Proxy - Used for LLM-based parsing of legislation structure, article classification, and translation/explanation.
  - SDK/Client: `openai` npm package (v6.17.0)
  - Auth: API key in `OPENAI_API_KEY` env var, base URL in `OPENAI_BASE_URL` env var
  - Models: `OPENAI_MODEL` and `VISION_MODEL` (both configured as `9router` in development)

**OCR & Vision API:**
- Google Cloud Vision API - Used for fallback optical character recognition (OCR) of scanned PDF pages.
  - SDK/Client: REST API calls via `fetch` (implemented in `src/lib/ocr-service.ts`)
  - Auth: API key in `GOOGLE_VISION_API_KEY` env var

## Data Storage

**Databases:**
- PostgreSQL - Primary relational database.
  - Connection: via `DATABASE_URL` env var (port 5434 in dev)
  - Client: Prisma ORM (v7.3.0) with `@prisma/adapter-pg`
  - Migrations: prisma migrate under `prisma/migrations/`

**File Storage:**
- MinIO Object Storage - For storing original PDF files of uploaded legislation.
  - SDK/Client: `minio` npm package (v8.0.6)
  - Auth: Credentials in `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` env vars
  - Connection: Hostname and port in `MINIO_ENDPOINT` and `MINIO_PORT` (port 9002 in dev)
  - Bucket: `MINIO_BUCKET_NAME` (default: `puu-documents`)

**Caching:**
- Memory Cache: In-memory rate limiting and LLM call optimization using `lru-cache` (v11.2.5).

## Authentication & Identity

**Auth Provider:**
- NextAuth.js (v5 beta) - Handles user login and session verification.
  - Implementation: Custom credentials provider (implemented in `src/lib/auth.ts`)
  - Token storage: httpOnly cookies containing secure sessions
  - Verification: Password verification using `bcryptjs` for encryption and matching

## Monitoring & Observability

**Logs:**
- Standalone logs: stdout/stderr console output (using `console.log` and `console.error` helpers)

## CI/CD & Deployment

**Hosting & Containers:**
- Docker - Deployment containerization
  - Docker Compose: orchestrates multi-container runtime (`docker-compose.yml`) specifying `app`, `postgres`, `minio`, and `createbuckets` containers
  - Dockerfile: Multi-stage Node.js build for building Next.js and starting production app

## Environment Configuration

**Development:**
- Required env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `VISION_MODEL`, `GOOGLE_VISION_API_KEY`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`, `PASAL_ID_TOKEN`, `AUTH_SECRET`, `NEXTAUTH_URL`.
- Secrets location: Local `.env` file (gitignored)
- Mock/stub services: Docker Compose spawns local Postgres and MinIO instances, fallback mock logic in services for MinIO or LLM failures.

**Production:**
- Managed via container environment variables or server orchestration tool secrets.

---

*Integration audit: 2026-07-25*
*Update when adding/removing external services*
