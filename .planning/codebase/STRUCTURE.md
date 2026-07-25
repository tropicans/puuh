# Codebase Structure

**Analysis Date:** 2026-07-25

## Directory Layout

```
puu/
├── .agent/             # GSD instructions, settings, and skills
├── prisma/             # Prisma ORM setup and migrations
│   └── migrations/    # SQL migration records
├── public/             # Static public assets
├── scripts/            # Database utility scripts
├── src/                # Primary application source
│   ├── actions/        # Next.js Server Actions (mutations & data actions)
│   ├── app/            # App Router pages and API routes
│   │   ├── api/        # REST APIs (auth, upload, document endpoints)
│   │   ├── compare/    # Comparison routing views
│   │   ├── dashboard/  # Application Dashboard
│   │   ├── design/     # Theme test views
│   │   ├── login/      # Auth login components
│   │   ├── manage/     # Admin management paths
│   │   ├── regulations/# Regulation details
│   │   ├── settings/   # App settings views
│   │   └── upload/     # File upload pages
│   ├── components/     # React presentation components
│   │   ├── common/     # Reusable UI elements
│   │   ├── comparison/ # Highlighted diff panels
│   │   ├── dashboard/  # Dashboard segments
│   │   ├── layout/     # Shared layout wrappers (Sidebar, Topbar)
│   │   ├── regulations/# Legislation lists and timelines
│   │   ├── search/     # Search input bars
│   │   └── ui/         # shadcn headless primitives
│   └── lib/            # Specialized library services (LCS, OCR, PDF parser)
├── Dockerfile          # Multi-stage production container build
├── docker-compose.yml  # Multi-service runtime configuration
├── package.json        # Node dependencies and scripts
└── tsconfig.json       # TypeScript options
```

## Directory Purposes

**prisma/**
- Purpose: Database configuration, schemas, and tracking migrations.
- Contains: `schema.prisma` mapping database relations and SQL migrations.
- Key files: `schema.prisma`.

**src/actions/**
- Purpose: React Server Actions implementing server mutations, authorization, and database calls.
- Contains: `regulations.ts` and `users.ts` server logic.
- Key files: `regulations.ts` - creates, modifies, and deletes regulation metadata and text changes.

**src/app/**
- Purpose: App Router directory defining URL page hierarchies and API routes.
- Contains: Page paths, layouts, styles, and API route handlers (`route.ts`).
- Key files: `layout.tsx` - top-level view wrapper, `globals.css` - global styling rules.

**src/components/**
- Purpose: Reusable and page-specific React UI components.
- Contains: Layouts, custom forms, diff renderers, and shadcn inputs.
- Key files: components in `comparison/` for highlighting article diffs.

**src/lib/**
- Purpose: Core application service layer, algorithms, and third-party wrappers.
- Contains: PDF parsers, OCR, custom LCS comparison engine, rate limiters, and Pasal.id API client.
- Key files: `diff-engine.ts` - custom LCS token matcher, `ocr-service.ts` - Google Vision OCR, `pdf-service.ts` - digital text readers.

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - Root index view redirecting to dashboard.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth entry handler.

**Configuration:**
- `tsconfig.json` - TypeScript path mappings and compiler settings.
- `next.config.ts` - Next.js compiler config.
- `postcss.config.mjs` - PostCSS compilation for Tailwind.
- `eslint.config.mjs` - Lint rule validation.
- `prisma.config.ts` - Prisma DB adapter endpoint connection.
- `components.json` - shadcn component configuration.
- `.env` - Environment secrets.

**Core Logic:**
- `src/lib/diff-engine.ts` - Longest Common Subsequence logic for legislation word matching.
- `src/lib/pdf-service.ts` - Digital PDF parsing chain.
- `src/lib/ocr-service.ts` - Resilient image OCR fallbacks.
- `src/lib/ai-service.ts` - AI extraction of legislation chapters and articles.
- `src/lib/storage.ts` - MinIO object upload operations.
- `src/lib/regulation-fetcher.ts` - Pasal.id API client.

**Testing:**
- `src/lib/diff-engine.test.ts` - Unit test file for comparison engine.
- `src/lib/ocr-service.test.ts` - Resilient OCR testing routines.
- `src/lib/regulation-fetcher.test.ts` - Pasal.id mock queries.
- `vitest.config.ts` - Vitest parameters.

## Naming Conventions

**Files:**
- kebab-case.ts/js: Utility modules and files (`diff-engine.ts`, `pdf-service.ts`).
- PascalCase.tsx: React components (`RegulationList.tsx`, `VersionTimeline.tsx`).
- standard-next-files: `page.tsx`, `layout.tsx`, `route.ts`.
- *.test.ts: Tests matching target logic.

**Directories:**
- kebab-case: Directories grouping pages, UI widgets, or services (`src/actions`, `src/components`).
- plural names: Groupings of multiple items (`actions`, `components`, `regulations`).

**Special Patterns:**
- index.ts: Used for modular package imports.

## Where to Add New Code

**New Feature (Backend Action / Service):**
- Primary code: `src/actions/` (for mutations) or `src/lib/` (for computations).
- Tests: Alongside implementation with `.test.ts`.

**New Component/UI Piece:**
- Implementation: `src/components/` under the corresponding subdirectory.
- Styling: Built-in Tailwind v4 classes within component JSX.

**New Route / Endpoint:**
- Definition: `src/app/` under the path directory (using `page.tsx` or `api/*/route.ts`).

## Special Directories

**.agent/**
- Purpose: Agentic configurations, skills, and status tracking.
- Committed: Yes (holds workflow plans and context mapping files).

**.next/**
- Purpose: Build outputs generated during compiler assembly.
- Committed: No (in `.gitignore`).

**node_modules/**
- Purpose: Standard external dependencies.
- Committed: No (in `.gitignore`).

---

*Structure analysis: 2026-07-25*
*Update when directory structure changes*
