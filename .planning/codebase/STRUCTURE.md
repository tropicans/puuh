# Codebase Structure

**Analysis Date:** 2026-06-07

## Directory Layout

```
puu/
├── .agent/              # Agent skill configurations, GSD core workflows, and templates
├── prisma/              # Prisma configuration and schema definition
│   └── schema.prisma    # Database schema (PostgreSQL)
├── public/              # Static public assets (images, icons, etc.)
├── scripts/             # Infrastructure helper scripts (e.g. DB status checks)
├── src/                 # Application source code
│   ├── actions/         # Next.js Server Actions (data fetching & mutation)
│   ├── app/             # Next.js App Router (pages, layouts, and API routes)
│   ├── components/      # Reusable React components (shadcn/ui + feature views)
│   └── lib/             # Shared libraries and business helper utilities
├── .env                 # Environment variables configuration
├── docker-compose.yml   # Multi-container orchestration (App, Postgres, MinIO)
├── Dockerfile           # Docker configuration for production build
├── package.json         # npm package manifest and dependencies
└── tsconfig.json        # TypeScript compiler configuration
```

## Directory Purposes

**src/actions/**
- Purpose: Contains server actions invoked directly by React client/server components.
- Contains: `regulations.ts`, `users.ts`.
- Key files:
  - `regulations.ts`: CRUD operations for regulation types, regulations, versions, and articles.
  - `users.ts`: Actions to fetch users or seed administrative user accounts.

**src/app/**
- Purpose: Next.js App Router page components, global layouts, styles, and API route handlers.
- Contains:
  - `api/`: API endpoints, including `/api/upload` (streamed file processor), `/api/auth` (NextAuth), `/api/db-status`.
  - `compare/`: Version comparison page.
  - `dashboard/`: Application overview and search panel.
  - `regulations/`: Detail pages for specific regulations and versions.
  - `upload/`: Form for admins to upload new PDF files.
  - `globals.css`: Tailwind v4 styles.
  - `layout.tsx` & `page.tsx`: Core shell and redirection logic.

**src/components/**
- Purpose: Modular React UI components divided by domain.
- Subdirectories:
  - `common/`: Reusable basic components (e.g., `Pagination.tsx`).
  - `comparison/`: Side-by-side version comparison items.
  - `dashboard/`: Dashboard statistics and overview UI.
  - `layout/`: Shell frame layout (`app-shell.tsx`).
  - `regulations/`: Timelines (`VersionTimeline.tsx`) and regulation listing grids (`RegulationList.tsx`).
  - `search/`: Advanced query panels (`UnifiedSearchBar.tsx`, `SearchInput.tsx`, `RegulationFilters.tsx`).
  - `skeletons/`: Visual loading placeholders.
  - `ui/`: shadcn/ui primitives.

**src/lib/**
- Purpose: Domain services and helper classes containing business logic.
- Key files:
  - `ai-service.ts`: Interfaces with custom proxy LLM for text parsing and analysis.
  - `pdf-service.ts`: Digital text extractor.
  - `ocr-service.ts`: Vision-based OCR processor.
  - `storage.ts`: MinIO object storage API client.
  - `diff-engine.ts`: LCS verbatim token diff engine.
  - `auth.ts`: NextAuth initialization and credential validation config.
  - `authorization.ts`: User permissions/role helper functions.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - App entry point (redirects to dashboard).
- `src/app/api/upload/route.ts` - Streamed upload endpoint.
- `docker-compose.yml` - Infrastructure launcher.

**Configuration:**
- `tsconfig.json` - TypeScript config with `@/*` mapping.
- `package.json` - Dependencies and build scripts.
- `next.config.ts` - Next.js configurations.
- `.env` - Project environment variables.
- `components.json` - shadcn/ui initialization file.

**Core Logic:**
- `src/lib/` - Business engines (AI, PDF parsing, OCR, Storage).
- `src/actions/` - DB mutation/read orchestrators.

**Testing:**
- Currently none (no testing frameworks or test suites configured).

## Naming Conventions

**Files:**
- PascalCase for React components: `UnifiedSearchBar.tsx`, `RegulationFilters.tsx`.
- kebab-case for utilities, route configurations, and server actions: `ai-service.ts`, `diff-engine.ts`, `regulations.ts`.
- Special Next.js filenames: `page.tsx`, `layout.tsx`, `route.ts`.

**Directories:**
- kebab-case for all source directories: `src/components/ui/`, `src/app/api/db-status/`.

**Special Patterns:**
- `index.ts` is not heavily used as a barrel export file; files are imported directly via path alias, e.g., `import prisma from '@/lib/prisma'`.

## Where to Add New Code

**New Feature (e.g., User Activity Log):**
- UI View: `src/app/activity/page.tsx`
- Layout/Components: `src/components/activity/ActivityLogList.tsx`
- Server Action: `src/actions/activity.ts`
- Database Schema: Add `ActivityLog` model in `prisma/schema.prisma` and run `npx prisma migrate dev`.

**New UI Component:**
- Domain Component: `src/components/<domain>/ComponentName.tsx`
- Reusable Primitive: `npx shadcn@latest add <component>` (adds to `src/components/ui/`).

**Utilities:**
- Helper code: Create `src/lib/<service-name>.ts`.

---

*Structure analysis: 2026-06-07*
*Update when directory structure changes*
