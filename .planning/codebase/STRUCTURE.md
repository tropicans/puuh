# Codebase Structure

**Analysis Date:** 2026-06-10

## Directory Layout

```
puuh/
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts              # Database seeding script
├── src/
│   ├── app/                 # Next.js App Router pages and routes
│   │   ├── api/             # API route handlers
│   │   │   ├── auth/        # NextAuth endpoints
│   │   │   ├── regulations/ # Regulation CRUD operations
│   │   │   ├── versions/    # Version management endpoints
│   │   │   ├── articles/    # Article endpoints
│   │   │   ├── export/      # PDF export endpoint
│   │   │   ├── seed/        # Data seeding endpoint
│   │   │   ├── upload/      # File upload handler
│   │   │   └── test-*.ts    # Diagnostic endpoints
│   │   ├── regulations/[id]/ # Regulation detail page
│   │   ├── manage/          # Admin management pages
│   │   ├── settings/        # Admin settings page
│   │   ├── upload/          # File upload page
│   │   ├── compare/         # Comparison view page
│   │   ├── dashboard/       # Main dashboard
│   │   ├── login/           # Authentication page
│   │   ├── page.tsx         # Root landing page
│   │   ├── layout.tsx       # Root layout wrapper
│   │   ├── globals.css      # Global Tailwind styles
│   │   └── favicon.ico      # favicon
│   ├── actions/             # Server actions (form mutations)
│   │   ├── regulations.ts   # Regulation CRUD actions
│   │   └── users.ts         # User management actions
│   ├── lib/                 # Shared libraries and utilities
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── authorization.ts # Role checks
│   │   ├── data-service.ts  # Data fetching helpers
│   │   ├── pdf-service.ts   # PDF text extraction
│   │   ├── ai-service.ts    # LLM integration
│   │   ├── storage.ts       # MinIO client
│   │   ├── diff-engine.ts   # Text comparison engine
│   │   ├── validations.ts   # Zod schemas
│   │   ├── utils.ts         # Helper functions
│   │   ├── logger.ts        # Logging utility
│   │   ├── rate-limit.ts    # Rate limiter factory
│   │   └── judicial-review.ts # Judicial review helpers
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── common/          # Reusable components
│   │   ├── regulations/     # Regulation-specific UI
│   │   ├── comparison/      # Comparison visualization
│   │   ├── search/          # Search components
│   │   └── skeletons/       # Loading states
│   └── hooks/               # Custom React hooks
│       ├── useAsyncAction.ts
│       └── useFlashMessage.ts
├── .planning/               # Planning documents (codebase maps)
│   └── codebase/            # Generated documentation
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── next.config.mjs          # Next.js configuration
├── tailwind.config.js       # Tailwind CSS config
└── postcss.config.mjs       # PostCSS configuration
```

## Directory Purposes

### prisma/
- **Purpose:** Database schema, migrations, and seeding
- **Contains:** `schema.prisma` (all models), `seed.ts` (default users)
- **Key files:** `prisma/schema.prisma`

### src/app/
- **Purpose:** Next.js App Router implementation
- **Contains:** Pages, layouts, API routes
- **Key files:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/api/*/route.ts`

### src/actions/
- **Purpose:** Server actions for form submissions
- **Contains:** Mutations that require `use server`
- **Key files:** `src/actions/regulations.ts`, `src/actions/users.ts`

### src/lib/
- **Purpose:** Shared business logic and utilities
- **Contains:** Prisma client, auth, services, validators
- **Key files:** `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/ai-service.ts`

### src/components/
- **Purpose:** React component library
- **Contains:** shadcn/ui components and custom components
- **Key files:** `src/components/ui/button.tsx`, `src/components/regulations/RegulationList.tsx`

### src/hooks/
- **Purpose:** Custom React hooks
- **Contains:** Reusable stateful logic
- **Key files:** `src/hooks/useAsyncAction.ts`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Root landing page
- `src/app/layout.tsx`: Root layout with theme provider
- `src/app/api/auth/[...nextauth]/route.ts`: Auth route handler
- `src/app/api/upload/route.ts`: File upload endpoint with streaming

**Configuration:**
- `package.json`: Project metadata, scripts, dependencies
- `tsconfig.json`: TypeScript compiler options
- `next.config.mjs`: Next.js build configuration
- `tailwind.config.js`: Tailwind CSS theme and plugins

**Core Logic:**
- `src/lib/prisma.ts`: Prisma client singleton
- `src/lib/ai-service.ts`: LLM integration for article parsing
- `src/lib/diff-engine.ts`: Verbatim text comparison
- `src/lib/data-service.ts`: Database query helpers

**Testing:**
- `src/__tests__/validation.test.ts`: Validation schema tests
- `src/__tests__/diff-engine.test.ts`: Diff engine tests
- `src/__tests__/utils.test.ts`: Utility function tests
- `src/__tests__/authorization.test.ts`: Auth checks tests

## Naming Conventions

**Files:**
- Component files: `PascalCase.tsx` (e.g., `RegulationList.tsx`, `UnifiedSearchBar.tsx`)
- Utility files: `camelCase.ts` (e.g., `utils.ts`, `pdf-service.ts`)
- Test files: `*.test.ts` (e.g., `diff-engine.test.ts`)
- API routes: `src/app/api/*/route.ts` (e.g., `src/app/api/upload/route.ts`)

**Directories:**
- Component directories: `kebab-case` (e.g., `src/components/common/`)
- Test directories: `__tests__/` (plural)
- API route directories: `src/app/api/*/` (e.g., `src/app/api/regulations/`)

**Variables/Functions:**
- Variables/Functions: `camelCase` (e.g., `getFilteredRegulations`, `extractTextFromPdf`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_LOGIN_ATTEMPTS`)
- TypeScript types: `PascalCase` (e.g., `RegulationFilters`, `ChangeAnalysis`)

**Prisma:**
- Enums: `UPPER_SNAKE_CASE` (e.g., `ACTIVE`, `AMENDED`, `REVOKED`)
- Model names: `PascalCase` (e.g., `Regulation`, `RegulationVersion`, `Article`)

## Where to Add New Code

**New Feature Page:**
- Page: `src/app/features/new-feature/page.tsx`
- API route (if needed): `src/app/api/features/new-feature/route.ts`
- Action (if mutation needed): `src/actions/features.ts`

**New UI Component:**
- Implementation: `src/components/ui/new-component.tsx`
- If shadcn-based: `src/components/ui/new-component.tsx` (using `npx shadcn@latest add`)

**New Database Feature:**
- Update schema: `prisma/schema.prisma`
- Generate client: `npx prisma generate`
- Add service: `src/lib/data-service.ts` or `src/lib/model-name-service.ts`
- Add validation: `src/lib/validations.ts`

**New Utility Function:**
- General purpose: `src/lib/utils.ts`
- Domain-specific: `src/lib/domain-utils.ts` (e.g., `src/lib/judicial-review.ts`)

**New API Endpoint:**
- Route: `src/app/api/resource/route.ts`
- Implement GET/POST/PUT/DELETE handlers
- Add authorization check with `getCurrentUser()`
- Validate input with Zod schema from `src/lib/validations.ts`

**New Server Action:**
- Add to existing `src/actions/` file or create new
- Use `use server` directive at top
- Return structured result: `{ success, data?, error? }`
- Call `revalidatePath()` after mutations affecting UI

## Special Directories

**src/__tests__/**
- Purpose: Unit and integration tests
- Generated: Manual (no automatic generation)
- Committed: Yes (tests are part of the codebase)

**prisma/**
- Purpose: Database schema and migrations
- Generated: `npx prisma generate` creates client
- Committed: Yes (schema is tracked)

**src/components/ui/**
- Purpose: shadcn/ui component library
- Generated: Manual or via `npx shadcn@latest add`
- Committed: Yes (components are application code)

---

*Structure analysis: 2026-06-10*
