# Architecture

**Analysis Date:** 2026-08-07

## Pattern Overview

**Overall:** Decoupled Monorepo with BFF (Backend-For-Frontend) and REST API Pattern

**Key Characteristics:**
- **Decoupled Architecture:** Next.js frontend is fully separated from Express.js backend.
- **BFF Design Pattern:** Frontend Next.js acts as a thin proxy (BFF), forwarding user context and requests to backend REST API. It handles web rendering, route protection, and session cookie validation.
- **Stateless REST backend:** Express.js API acts as a stateless backend executing business logic, ORM mappings, external AI integration, and file storage.
- **Containerized Orchestration:** Multi-container docker stack managing separate services (app, backend, postgres, minio, docling-serve).

## Layers

**Frontend Presentation Layer (`frontend/src/app/**`):**
- Purpose: Render user interfaces (SSR and CSR) and manage routes.
- Contains: React components, Next.js page layouts, Next.js CSS configurations.
- Depends on: Frontend BFF Layer, shadcn UI components.
- Used by: Browser clients.

**Frontend BFF Layer (`frontend/src/actions/**`, `frontend/src/app/api/**`):**
- Purpose: Proxy client requests, manage cookies and rate limits, and propagate user session contexts.
- Contains: Next.js Server Actions, API route handlers, and custom middleware (`frontend/src/proxy.ts`).
- Depends on: Backend API Client (`frontend/src/lib/api.ts`).
- Used by: Frontend Presentation Layer.

**Backend REST Router Layer (`backend/src/routes/**`):**
- Purpose: Expose RESTful JSON HTTP endpoints, validate HTTP parameters, and check route authentication.
- Contains: Express.js routers and routes mapping endpoints (e.g. `/api/regulations`).
- Depends on: Backend Core Service Layer.
- Used by: Frontend BFF Layer (via HTTP).

**Backend Core Service Layer (`backend/src/lib/**`):**
- Purpose: Handle core business logic (Docling extraction, LLM parsing, object storage interactions).
- Contains: PDF service, LLM AI parsing service, MinIO storage client wrapper.
- Depends on: Database ORM (Prisma client).
- Used by: Backend REST Router Layer.

**Data Access Layer (`backend/prisma/**`):**
- Purpose: Define schemas and query the PostgreSQL database.
- Contains: Prisma schema, migration scripts, and seeder.
- Depends on: PostgreSQL database instance.
- Used by: Backend Core Service Layer.

## Data Flow

**PDF Regulation Upload Flow:**

1. User uploads a PDF file on the webpage form (`frontend/src/app/upload/page.tsx`).
2. Browser client posts multipart data to the local BFF proxy route handler (`frontend/src/app/api/upload/route.ts`).
3. BFF handler verifies NextAuth user session, forwards/pipes the multipart stream, and appends user context headers (`X-User-Id` & `X-User-Role`) to the backend.
4. Backend REST route handler (`backend/src/routes/upload.ts`) receives multipart data via Multer middleware in memory.
5. Backend calls PDF service (`backend/src/lib/pdf-service.ts`) to stream the file buffer to MinIO storage.
6. PDF service triggers Docling layout extraction (`docling-serve` microservice). If Docling is down/fails, it automatically triggers fallback vision OCR.
7. Extracted raw Markdown is sent to the LLM AI service (`backend/src/lib/ai-service.ts`) for structured article clause extraction.
8. Parsed articles are saved into PostgreSQL via Prisma client, and extraction status is returned.
9. BFF handler forwards the extraction progress updates via Server-Sent Events (SSE) to the browser UI.

**State Management:**
- Stateless BFF/API: Request contexts are generated dynamically per execution.
- Session State: Maintained in encrypted NextAuth JWT cookies.
- Database State: Stored persistently in PostgreSQL.
- File State: Stored persistently in MinIO.

## Key Abstractions

**BFF Client Helper (`frontend/src/lib/api.ts`):**
- Purpose: Provide standard HTTP client wrapper (`fetchFromBackend`) that handles URL resolving, JSON casting, and propagating user context headers.
- Pattern: Modular Helper.

**Authentication Middleware (`backend/src/middleware/auth.ts`):**
- Purpose: Check incoming request headers for authenticated user presence and validate permissions for administrative actions.
- Pattern: Express Middleware.

**Database Client (`backend/src/lib/prisma.ts`):**
- Purpose: Initialize and share a single PrismaClient connection pool instance.
- Pattern: Singleton.

## Entry Points

**Frontend Application:**
- Location: `frontend/src/app/page.tsx` / `frontend/src/proxy.ts` (Next.js entry/middleware).
- Invocation: User opens a browser to port 3006.

**Backend Server:**
- Location: `backend/src/server.ts`.
- Invocation: `npm run dev` or docker running `node dist/server.js` listening on port 3007.

**Docker Compose migrations:**
- Location: `db-migrate` service (executes `npx prisma migrate deploy` and `npx prisma db seed` on boot).

## Error Handling

**Strategy:** Fail-safe defensive programming with middleware catching.

**Patterns:**
- Backend API endpoints wrap logic in standard `try/catch` blocks and use a centralized Express error logging structure. Returns standard JSON errors (`{ error: string }`) with appropriate HTTP statuses.
- Frontend Server Actions capture backend HTTP error codes and return structured `{ success: false, error: string }` objects without raising exceptions to React components.
- Frontend UI pages render defensive warning banners (`frontend/src/components/common/StatusBanner.tsx`) on API or network failures.

## Cross-Cutting Concerns

**Logging:**
- Backend Express uses custom logger formats in `backend/src/utils/logger.ts` outputting structured details to console.

**Validation:**
- Implements shared Zod validation schemas (`backend/src/utils/validations.ts`) for all REST route request bodies.

**Authentication check:**
- Next.js middleware `frontend/src/proxy.ts` performs route authorization checks on the web server level.
- Backend routes check context headers using Express middleware (`backend/src/middleware/auth.ts`).

---

*Architecture analysis: 2026-08-07*
*Update when major patterns change*
