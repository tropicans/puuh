<!-- generated-by: gsd-doc-writer -->
# Configuration

**Analysis Date:** 2026-08-07

This document details the configuration properties and environment variables required to run the PUU Tracker application.

## Environment Variables

The application is split into `frontend` (Next.js BFF) and `backend` (Express.js API) workspaces. Each workspace reads environment variables from its local `.env` file.

### Backend Configuration (`backend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `3007` | The port the backend Express server listens on. |
| `DATABASE_URL` | **Required** | — | Connection string to PostgreSQL database. |
| `OPENAI_API_KEY` | **Required** | — | OpenAI-compatible key for LLM parsing and fallbacks. |
| `OPENAI_BASE_URL` | **Required** | — | Base URL endpoint for LLM proxy request calls. |
| `OPENAI_MODEL` | Optional | `gpt-oss-120b-medium` | The model string passed to OpenAI chat completions. |
| `MINIO_ENDPOINT` | Optional | `localhost` | MinIO server address. |
| `MINIO_PORT` | Optional | `9000` | MinIO server port. |
| `MINIO_USE_SSL` | Optional | `false` | Enable/disable secure connection to MinIO storage. |
| `MINIO_ACCESS_KEY` | **Required** | — | MinIO connection user key. |
| `MINIO_SECRET_KEY` | **Required** | — | MinIO connection secret password. |
| `MINIO_BUCKET_NAME`| Optional | `puu-documents` | Name of the bucket where PDF files are stored. |
| `DOCLING_API_URL` | Optional | `http://localhost:5001` | Connection endpoint to `docling-serve` container. |

### Frontend Configuration (`frontend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXTAUTH_SECRET` | **Required** | — | Random secret base64 key to sign cookies. <!-- VERIFY: NextAuth secret configuration --> |
| `NEXTAUTH_URL` | **Required** | `http://localhost:3006` | Callback redirect URL for NextAuth session cookies. <!-- VERIFY: Deployed frontend base URL --> |
| `BACKEND_URL` | Optional | `http://localhost:3007` | Port/address mapping the Express REST API backend server. <!-- VERIFY: Deployed backend base URL --> |

## Required vs Optional Settings

- Missing `DATABASE_URL` or database server being down will cause backend start-up failure on Zod schema parse.
- Missing `OPENAI_API_KEY` prevents PDF parsing and LLM operations from succeeding.
- NextAuth requires a strong `AUTH_SECRET` to be configured on the web application container.

## Per-Environment Overrides

- **Development:** Locally read from `.env` in both folders. Docker Compose overrides these variables by binding ports (`3006` for frontend, `3007` for backend, `5434` for database, and `9002` for MinIO) to localhost.
- **Production:** Variables are mapped inside production environments via secure hosting environment managers or production Docker orchestration stacks.

---

*Configuration analysis: 2026-08-07*
