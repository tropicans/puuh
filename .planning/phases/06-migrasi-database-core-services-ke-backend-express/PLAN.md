# Phase 6 Plan: Migrasi Database & Core Services ke Backend Express

Migrasi database (Prisma schema, client, seed, dan migrasi) dan service inti backend (Minio Object Storage client, PDF extraction service, OCR service, dan AI LLM service) dari codebase Next.js ke Express backend terpisah di direktori `backend/`. Menyediakan REST API endpoint di Express untuk menerima file PDF secara multi-part via Multer, menyimpannya di Minio, mengekstrak data PDF, dan mengintegrasikan framework CORS untuk komunikasi aman dengan frontend.

## Proposed Changes

### Database Migration
- **backend/prisma/schema.prisma**: Schema Prisma yang dimigrasi dari frontend.
- **backend/prisma/seed.ts**: Script seed database yang dimigrasi dari frontend.
- **backend/prisma/migrations/**: Migrasi database yang dipindahkan ke backend.

### Backend Core Services
- **backend/src/config/index.ts**: Centralized config module validating env variables using Zod.
- **backend/src/lib/prisma.ts**: Initializing Prisma Client singleton.
- **backend/src/lib/storage.ts**: Storage client connection to MinIO.
- **backend/src/lib/pdf-service.ts**: Core PDF extraction service with fallback logic.
- **backend/src/lib/ocr-service.ts**: Google Cloud Vision OCR helper.
- **backend/src/lib/ai-service.ts**: LLM article extraction parser.

### API Routes
- **backend/src/routes/upload.ts**: Express route implementing multipart upload via Multer, storage, and processing.
- **backend/src/routes/index.ts**: Core router registering `/upload` endpoint.
- **backend/src/app.ts**: Express application configuring middleware (cors, express.json) and base routes.

### Dependencies & Setup
- **backend/package.json**: Dev & production dependencies installed (express, multer, cors, pg, prisma, etc.).
- **frontend/package.json**: Update prisma generation command to point to backend schema.

## Verification Plan

### Automated Tests
- Run `npm run test --workspace=backend` to verify all migrated unit tests pass.

### Manual Verification
1. Run `npm run dev:backend` or `npm run dev` to verify the backend server starts successfully on port 3007.
2. Run database migration and seeding: `npm run db:migrate && npm run db:seed` from root.
