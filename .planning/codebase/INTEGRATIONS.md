# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Custom LLM Proxy API:**
- **Service:** OpenAI-compatible API proxy (`https://proxy.kelazz.my.id/v1`)
  - **SDK/Client:** Fetch-based custom calls in `src/lib/ai-service.ts`
  - **Auth:** Bearer token in `OPENAI_API_KEY` env var
  - **Model:** `gpt-oss-120b-medium` (for parsing and change analysis)
  - **Model (Vision):** `gemini-2.5-flash` (for scanned PDF OCR in `src/lib/ocr-service.ts`)
  - **Endpoints used:** `/chat/completions`, `/models`

**Google Vision API:**
- **Status:** Unused in application code.
- **Reference:** Configured in `.env` (`GOOGLE_VISION_API_KEY`) and `docker-compose.yml` but has no references in `src/` code.

## Data Storage

**Databases:**
- **Type/Provider:** PostgreSQL (running in Docker container `puu-tracker-postgres` on port 5434 locally, 5432 internally)
  - **Connection:** via `DATABASE_URL` env var
  - **Client:** Prisma ORM with `@prisma/client` ^7.3.0
  - **Migrations:** Managed via Prisma CLI in `prisma/migrations/`

**File Storage (Object Storage):**
- **Service:** MinIO (running in Docker container `puu-tracker-minio` on port 9002/9003 console, 9000 API)
  - **SDK/Client:** `minio` npm package v8.0.6 (initialized in `src/lib/storage.ts`)
  - **Auth:** Credentials in `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` env vars
  - **Bucket:** `puu-documents` (defined in `MINIO_BUCKET_NAME`)

## Authentication & Identity

**NextAuth.js Auth Provider:**
- **Implementation:** Credentials provider (email and password) configured in `src/lib/auth.ts`.
- **Encryption:** Password hashing using `bcryptjs` v3.x.
- **Session Strategy:** JWT (JSON Web Tokens).
- **Callback URL:** `http://localhost:3006/api/auth/callback/credentials`.

## Monitoring & Observability

**Error Tracking & Logs:**
- **System:** Standard output/error (`console.log`, `console.error`).
- **Observability:** Standard server/console logs in Docker. No external monitoring tools (such as Sentry or Datadog) are configured.

## CI/CD & Deployment

**Hosting & Pipelines:**
- **Hosting:** Docker containerized deployment. Includes `Dockerfile` and `docker-compose.yml`.
- **CI/CD:** No active workflows or build actions (no `.github/workflows` present).

## Environment Configuration

**Development Environment:**
- **Required env vars:**
  - `DATABASE_URL`: PostgreSQL connection string
  - `OPENAI_API_KEY`: Custom proxy auth key
  - `OPENAI_BASE_URL`: Custom proxy URL
  - `OPENAI_MODEL`: GPT model name
  - `AUTH_SECRET`: Secret key for JWT signing
  - `NEXTAUTH_URL`: Canonical URL of the app
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`: Storage configuration
- **Secrets Location:** `.env` file (local only, gitignored).

---

*Integration audit: 2026-06-08*
*Update when adding/removing external services*
