# Codebase Structure

**Analysis Date:** 2026-08-07

## Directory Layout

```
puu-monorepo/
├── .agent/             # GSD local config and installation resources
├── .planning/          # Project status tracking and version archives
│   ├── codebase/       # Codebase mapping files
│   └── milestones/     # Shipped version archives (roadmap + requirements)
├── backend/            # Express.js REST API service workspace
│   ├── prisma/         # Prisma configurations, migrations, and seeds
│   └── src/            # Backend server code
│       ├── config/     # Centralized configurations
│       ├── lib/        # Core business service logic (docling, OpenAI, minio)
│       ├── middleware/ # Express route check middlewares
│       ├── routes/     # Express route handlers
│       └── utils/      # Shared backend utilities
├── frontend/           # Next.js web application BFF workspace
│   ├── public/         # Public static assets
│   └── src/            # Next.js application source
│       ├── actions/    # BFF Server Actions calling backend Express routes
│       ├── app/        # Next.js app routes, pages, and layout definitions
│       ├── components/ # React presentation UI components
│       ├── hooks/      # Shared React state hooks
│       └── lib/        # NextAuth config and BFF fetch helpers
├── scripts/            # Build, deploy, and testing scripts
├── package.json        # Root monorepo workspace configuration
└── docker-compose.yml  # Local multi-container Docker compose orchestrator
```

## Directory Purposes

**backend/prisma/**
- Purpose: Database configuration, migrations execution, and seed generation.
- Contains: `schema.prisma` database schemas, `seed.ts` seed data.
- Subdirectories: `migrations/` containing chronological SQL scripts.

**backend/src/lib/**
- Purpose: Application core business services.
- Contains: PDF layout extraction (`pdf-service.ts`), LLM parsing engine (`ai-service.ts`), Fallback OCR (`ocr-service.ts`), MinIO storage connection (`storage.ts`).

**backend/src/routes/**
- Purpose: Expose backend functions as REST API endpoints.
- Contains: Routers routing specific legal domains (e.g. `regulations.ts`, `articles.ts`).

**frontend/src/actions/**
- Purpose: Frontend Backend-for-Frontend (BFF) Server Actions.
- Contains: thin action bridges (`regulations.ts`, `users.ts`) calling Express backend routes.

**frontend/src/app/**
- Purpose: Web page presentation routing and layouts.
- Contains: App router pages (e.g. `upload/page.tsx`, `compare/page.tsx`) and layout elements.
- Subdirectories: `api/` containing local BFF endpoint proxies.

**frontend/src/components/**
- Purpose: Presentation layer UI components.
- Contains: Common items (buttons, skeleton loaders), comparison engines, and timelines.
- Subdirectories: `common/`, `comparison/`, `layout/`, `regulations/`, `search/`, `skeletons/`, `ui/`.

**scripts/**
- Purpose: Continuous integration and local verification utilities.
- Contains: E2E smoke tests (`smoke-flow.mjs`).

## Key File Locations

**Entry Points:**
- `backend/src/server.ts` - Express.js API server listener port 3007.
- `frontend/src/proxy.ts` - Next.js Middleware route authorization proxy.
- `scripts/smoke-flow.mjs` - End-to-end verification smoke flow testing script.

**Configuration:**
- `package.json` - Root workspaces and concurently scripts definition.
- `backend/src/config/index.ts` - Config validator verifying `process.env`.
- `frontend/tsconfig.json` & `backend/tsconfig.json` - Compiler configurations.
- `docker-compose.yml` - Docker compose settings.

**Core Logic:**
- `backend/src/lib/pdf-service.ts` - Orchestrates Docling PDF parsing and vision fallbacks.
- `backend/src/lib/ai-service.ts` - Parses raw text into structured JSON.
- `frontend/src/lib/api.ts` - `fetchFromBackend` caller helper.

**Testing:**
- `frontend/vitest.config.ts` & `backend/vitest.config.ts` - Unit testing configs.

## Naming Conventions

**Files:**
- kebab-case.ts: Backend modules, utilities, and helper scripts.
- PascalCase.tsx: React component files in frontend.
- kebab-case.tsx: Page routing definitions in Next.js router.
- *.test.ts: Vitest unit testing files.

**Directories:**
- kebab-case: Directories representing names (e.g. `db-migrate`).
- plural for categories: routes/, actions/, components/, templates/.

## Where to Add New Code

**New Regulation Feature:**
- Frontend Page: create routing folder `frontend/src/app/my-feature/page.tsx`.
- Backend Route: create route script `backend/src/routes/my-feature.ts` and register in `backend/src/routes/index.ts`.
- BFF Action: create action method `frontend/src/actions/my-feature.ts`.
- Unit Test: create file adjacent to source or in `__tests__` using `.test.ts`.

**New Shared Component:**
- Implementation: `frontend/src/components/common/MyComponent.tsx` or `frontend/src/components/ui/MyComponent.tsx`.

**New Database Model:**
- Schema: update `backend/prisma/schema.prisma` and execute `npm run db:migrate`.

## Special Directories

**.planning/**
- Purpose: Project roadmap progress and milestone archives.
- Committed: Yes.

**node_modules/**
- Purpose: Library dependency packages.
- Committed: No (in `.gitignore`).

**.next/** / **backend/dist/**
- Purpose: Built output files for execution.
- Committed: No (in `.gitignore`).

---

*Structure analysis: 2026-08-07*
*Update when directory structure changes*
