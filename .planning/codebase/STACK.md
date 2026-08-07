# Technology Stack

**Analysis Date:** 2026-08-07

## Languages

**Primary:**
- TypeScript 5.x - Frontend and backend application code
- JavaScript (ESM) - Smoke test script (`scripts/smoke-flow.mjs`) and Docker execution scripts

**Secondary:**
- HTML5 / CSS3 (Tailwind CSS v4) - Frontend styling
- SQL - Prisma PostgreSQL migrations

## Runtime

**Environment:**
- Node.js v22.22.3 (via NVM)
- Docker/Docker Compose - Containerized local orchestrator running on Node:20-alpine base images

**Package Manager:**
- npm 10.9.8
- Lockfile: `package-lock.json` present in root workspace

## Frameworks

**Core:**
- Next.js 16.1.6 (React 19.2.3) - Frontend UI and BFF layer
- Express.js 4.19.2 - Backend REST API service

**Testing:**
- Vitest 4.1.8 - Separate unit testing runner configured for `frontend/` and `backend/`

**Build/Dev:**
- TypeScript Compiler (tsc)
- tsx - TypeScript execution and watch tool for development backend
- Tailwind CSS v4 - CSS compiler setup in frontend
- Esbuild - Used implicitly via Vitest and Next.js Turbopack

## Key Dependencies

**Critical:**
- @prisma/client 7.3.0 - Database ORM mapping PostgreSQL schemas
- next-auth 5.0.0-beta.30 - Authentication handler in frontend BFF
- bcryptjs 3.0.3 - Password hashing on database seeding and backend auth endpoints
- multer 1.4.5-lts.1 - Multipart form data parsing in backend Express uploads
- minio 8.0.6 - Object storage client in backend Express

**Infrastructure:**
- dotenv 17.2.3 - Environment configurations loading
- cors 2.8.5 - Express CORS handler
- openai 6.17.0 - OpenAI GPT models API integration
- pdfjs-dist 4.0.379 / pdf-parse 2.4.5 / pdf-lib 1.17.1 - PDF parsing utilities (fallbacks)
- docling-serve (Docker image: `quay.io/docling-project/docling-serve-cpu:v1.29.0`) - Layout-aware PDF extraction microservice

## Configuration

**Environment:**
- Backend configuration via `backend/.env` (DB URLs, MinIO configs, OpenAI keys, port)
- Frontend configuration via `frontend/.env` (NextAuth secrets, BFF URL mapping)
- Prisma client configuration in `backend/prisma/schema.prisma`

**Build:**
- Root `package.json` with workspace configuration
- `frontend/tsconfig.json` and `backend/tsconfig.json` - Compiler configurations
- `frontend/vitest.config.ts` and `backend/vitest.config.ts` - Test configurations

## Platform Requirements

**Development:**
- macOS, Linux, or Windows (tested on Windows PowerShell environment)
- Docker Desktop installed and running for containerized services (Postgres, MinIO, Docling-serve)

**Production:**
- Managed via multi-container Docker Compose. Production Dockerfiles use alpine images with non-root user setups (`node` user) for backend security.

---

*Stack analysis: 2026-08-07*
*Update after major dependency changes*
