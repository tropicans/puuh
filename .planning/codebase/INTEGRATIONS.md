# External Integrations

**Analysis Date:** 2026-08-07

## APIs & External Services

**AI / LLM Processing:**
- OpenAI API - Used to parse Indonesian legal clauses (pasal) from raw Markdown texts, validate them with heuristics, and identify versions/diffs of amendments.
  - SDK/Client: `openai` npm package v6.x
  - Auth: API key in `OPENAI_API_KEY` env var
  - Models: Dynamic model name loaded from server-side environment variables (e.g. `OPENAI_MODEL`)

**PDF Layout Extraction:**
- Docling Microservice - Layout-aware PDF extraction microservice running in an isolated CPU container (`docling-serve`).
  - SDK/Client: REST API via `fetch` HTTP calls in backend
  - Auth: Connected over local Docker network endpoint (`DOCLING_API_URL` env var, usually `http://docling-serve:5001/api/v1/convert`)

**Document AI (OCR & Fallback):**
- Fallback OCR Service - Used when PDF layout extraction via Docling is unavailable or fails. Uses cloud API for image/scan text extraction.
  - SDK/Client: OpenAI Chat Completions client using vision capabilities
  - Auth: Reuses the same `OPENAI_API_KEY` credentials
  - Models: Defaults to custom vision model configured via `OPENAI_MODEL` or fallback model string

## Data Storage

**Databases:**
- PostgreSQL - Relational database storing regulation versions, articles, changes, judicial reviews, and user credentials.
  - Connection: Connection string configured via `DATABASE_URL` env var
  - Client: Prisma ORM v7.3.0
  - Migrations: Managed sequentially in `backend/prisma/migrations/` and run during start up by `db-migrate` docker service

**File Storage:**
- MinIO Object Storage - S3-compliant object storage used to store the original uploaded PDF files of regulations.
  - SDK/Client: `minio` npm package v8.x
  - Auth: Credentials loaded via `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` env vars
  - Connection: API endpoint configured via `MINIO_ENDPOINT` and `MINIO_PORT` env vars
  - Buckets: `puu-documents` bucket created automatically if missing

**Caching:**
- LRU Cache - Local client/session-level rate-limiting cache on the frontend BFF layer.
  - Client: `lru-cache` npm package v11.x

## Authentication & Identity

**Auth Provider:**
- NextAuth (Auth.js) - Handles sessions, user credentials, JWT parsing, and login pages.
  - Implementation: credentials-provider configured in `frontend/src/lib/auth.ts`
  - Auth validation: Frontend BFF redirects login credentials verification calls (`POST /api/auth/login`) to the Express.js backend.
  - Token storage: `httpOnly` secure cookies managed by NextAuth
  - Authorization propagation: Frontend BFF server actions propagate authenticated user identifiers using `X-User-Id` and `X-User-Role` headers to Express endpoints.

## Monitoring & Observability

**Logs:**
- Console Logger - Structured stdout logging setup in Express backend.
  - Client: Winston-like custom formatter in `backend/src/utils/logger.ts`

## CI/CD & Deployment

**Hosting:**
- Docker Compose - Multi-container stack orchestration running locally.
  - Orchestrates: `app` (port 3006), `backend` (port 3007), `db-migrate`, `postgres` (port 5434), `minio` (ports 9002/9003), and `docling-serve` (port 5001).

## Environment Configuration

**Development:**
- Required Env Vars (Frontend): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`
- Required Env Vars (Backend): `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_USE_SSL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PORT`
- Secrets Location: `.env` file in `frontend/` and `backend/` (gitignored).

---

*Integration audit: 2026-08-07*
*Update when adding/removing external services*
