# Codebase Structure

**Analysis Date:** 2026-06-08

## Directory Layout

```
puuh/
├── prisma/             # Prisma schema, migrations, and seed scripts
├── public/             # Static public assets
├── scripts/            # Script files (e.g., custom smoke test runner)
├── src/                # Primary application source code
│   ├── actions/        # Next.js Server Actions (business logic mutations)
│   ├── app/            # Next.js page routes, layouts, and API endpoints
│   ├── components/     # React presentation components
│   │   ├── common/     # Reusable layout and helper elements
│   │   ├── comparison/ # Diffing UI and side-by-side versions components
│   │   ├── dashboard/  # Dashboard segments (Stats, lists)
│   │   ├── layout/     # Page frame structures (app-shell)
│   │   ├── regulations/# Regulation lists and upload forms
│   │   ├── search/     # Unified search components
│   │   ├── skeletons/  # UI Loading skeletons
│   │   └── ui/         # Base UI library (shadcn/ui primitives)
│   ├── hooks/          # React hooks (async helpers, flash messages)
│   ├── lib/            # Shared service utilities (LLM APIs, storage, parsers)
│   └── proxy.ts        # Next.js custom route/API handling proxy helper
├── package.json        # Dependencies list and scripts
└── tsconfig.json       # TypeScript options
```

## Directory Purposes

**prisma/**
- **Purpose:** Manages the database schema definitions and migrations.
- **Contains:** `schema.prisma` (DB model declaration) and `migrations/` directory.

**scripts/**
- **Purpose:** Development and test helper scripts.
- **Contains:** `smoke-flow.mjs` for checking application endpoints' availability.

**src/actions/**
- **Purpose:** Server actions layer encapsulating SQL mutations and revalidation.
- **Contains:** Server actions such as `regulations.ts` and `users.ts`.

**src/app/**
- **Purpose:** Layouts, pages, styles, and API route controllers under Next.js App Router.
- **Contains:** Page folders (`dashboard/`, `settings/`, `compare/`, `login/`, `upload/`), static files (`favicon.ico`), and global styles (`globals.css`).

**src/components/**
- **Purpose:** React presentational components.
- **Contains:** Visual components structured by domain or layout concerns.

**src/lib/**
- **Purpose:** Services layer for system features (diff logic, PDF reading, MinIO SDK wrapper, LLM parsing).
- **Contains:** Independent helper modules (`ai-service.ts`, `storage.ts`, `pdf-service.ts`, `diff-engine.ts`, `ocr-service.ts`).

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - App landing page redirection.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth entry point.

**Configuration:**
- `prisma/schema.prisma` - Database structure source of truth.
- `next.config.ts` - Next.js bundler and routing options.
- `eslint.config.mjs` - ESLint linter.
- `postcss.config.mjs` - Tailwind PostCSS processor.
- `components.json` - Shadcn UI paths configuration.

**Core Logic:**
- `src/actions/regulations.ts` - CRUD operations for regulations.
- `src/lib/ai-service.ts` - Deep parsing and LLM operations.
- `src/lib/diff-engine.ts` - Comparison difference engine.

**Testing:**
- `scripts/smoke-flow.mjs` - Custom automated HTTP smoke checks.

**Documentation:**
- `AGENTS.md` - Agent instruction guidelines.
- `README.md` - User setup and docker guidance.

## Naming Conventions

**Files:**
- **Domain components:** PascalCase (e.g. `RegulationSection.tsx`, `StatsSection.tsx`)
- **Shared/UI components:** kebab-case (e.g. `button.tsx`, `scroll-area.tsx`, `theme-toggle.tsx`)
- **API routes:** `route.ts`
- **Pages/Layouts:** `page.tsx` or `layout.tsx`
- **Actions and libraries:** kebab-case (e.g. `ai-service.ts`, `regulations.ts`, `useAsyncAction.ts`)

**Directories:**
- **Routing:** kebab-case matching the URL path (e.g. `api/regulations/`, `compare/`)
- **Library/Components:** Plural/Kebab-case grouping names (`actions/`, `components/dashboard/`)

## Where to Add New Code

**New Feature Pages:**
- Add folder under `src/app/` with name matching the path. Implement `page.tsx`.
- Connect logic via server actions in `src/actions/` or direct database helpers.

**New UI Components:**
- Base UI primitive: Add to `src/components/ui/` in kebab-case.
- Feature-bound component: Add to appropriate `src/components/[domain]/` folder in PascalCase.

**New API Endpoint:**
- Add folder in `src/app/api/` with `route.ts` declaring standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).

## Special Directories

**.next/**
- **Purpose:** Next.js build compilation cache.
- **Source:** Automatically generated during `npm run build` or `npm run dev`.
- **Committed:** No (in `.gitignore`).

**node_modules/**
- **Purpose:** Node dependencies.
- **Committed:** No (in `.gitignore`).

---

*Structure analysis: 2026-06-08*
*Update when directory structure changes*
```
