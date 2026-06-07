# External Integrations

**Analysis Date:** 2026-06-07

## APIs & External Services

**Custom LLM Proxy:**
- Service: Custom API proxy (`https://proxy.kelazz.my.id/v1`)
  - SDK/Client: Direct HTTP `fetch` requests
  - Auth: API key in `OPENAI_API_KEY` env var
  - Model: `gpt-oss-120b-medium` (for text parsing/processing) and `gemini-2.5-flash` (for vision OCR)
  - Purpose:
    - Text extraction/parsing of PDF contents (`src/lib/ai-service.ts` -> `parseArticlesFromText`)
    - Diff analysis of changes between article versions (`src/lib/ai-service.ts` -> `analyzeArticleChange`)
    - Overall comparison summary generation (`src/lib/ai-service.ts` -> `generateVersionComparisonSummary`)
    - Vision-based OCR (`src/lib/ocr-service.ts` -> `performOCR`)

**Google Vision API:**
- Status: **Unused config**
- Details: `GOOGLE_VISION_API_KEY` exists in `.env` and `docker-compose.yml` but is not referenced in the application source code. All OCR tasks use the custom LLM vision model (`gemini-2.5-flash` via proxy) instead.

## Data Storage

**Databases:**
- Type/Provider: PostgreSQL database running in a Docker container
  - Client: Prisma ORM v7.3.0
  - Connection: via `DATABASE_URL` env var
  - Port Discrepancy:
    - `.env` specifies port `5433` for host connection (`localhost:5433`)
    - `docker-compose.yml` maps container port `5432` to host port `5434` (`5434:5432`)
    - Within the Docker network, the app service connects to the `postgres` container directly on port `5432`

**File Storage:**
- Service: MinIO Object Storage running in a Docker container
  - Client: `minio` npm package v8.0.6
  - Auth: Access key (`minioadmin`) & Secret key (`minioadmin`) configured in environment variables
  - Bucket Name: `puu-documents` (auto-created if missing, made public-read by docker-compose `createbuckets` helper container)
  - Host Ports: maps to host port `9002` (API) and `9003` (Console)
  - Purpose: Stores uploaded original regulation PDF documents (`src/lib/storage.ts`)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js (v5.x Beta 30)
  - Implementation: Custom configuration in `src/lib/auth.ts`
  - Strategy: JSON Web Tokens (JWT) stored in httpOnly cookies
  - Authentication Method: Credentials-based login using email/password (hashed with `bcryptjs` and stored in `User` table)
  - User Roles: `ADMIN` (can write/edit/delete/upload) and `VIEWER` (read-only)

## CI/CD & Deployment

- Hosting/Deployment: Dockerized deployment using multi-stage `Dockerfile` and `docker-compose.yml`
- CI Pipeline: None configured

## Environment Configuration

**Development Environment (.env):**
- Required variables:
  - `DATABASE_URL` - Database connection
  - `OPENAI_API_KEY` - Custom proxy API key
  - `OPENAI_BASE_URL` - Custom proxy endpoint
  - `OPENAI_MODEL` - Default text model
  - `AUTH_SECRET` - NextAuth secret key
  - `NEXTAUTH_URL` - Application root URL
  - `MINIO_ENDPOINT` - MinIO host name
  - `MINIO_PORT` - MinIO host port
  - `MINIO_ACCESS_KEY` & `MINIO_SECRET_KEY` - MinIO credentials
  - `MINIO_BUCKET_NAME` - Bucket for PDF uploads

---

*Integration audit: 2026-06-07*
*Update when adding/removing external services*
