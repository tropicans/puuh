# AGENTS.md
Guide for agentic coding tools operating in this repository.

## Project Overview
- Framework: Next.js (App Router) + React 19 + TypeScript.
- Data: Prisma + PostgreSQL.
- UI: Tailwind CSS v4 + shadcn/ui + Radix.
- Auth: NextAuth credentials provider.
- Package manager in use: npm (`package-lock.json` exists).
- Local dev server port: `3006`.
- TS path alias: `@/*` maps to `src/*`.

## Repository Rules Files
- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.
- If these files are added later, treat them as high-priority instructions and update this doc.

## Core Commands
Use npm unless explicitly instructed otherwise.

```bash
npm ci
npm run dev
npm run build
npm run start
npm run lint
```

## Build, Lint, and Test
### Build/lint
- Start dev server: `npm run dev`.
- Build production app: `npm run build`.
- Run built app: `npm run start`.
- Lint codebase: `npm run lint`.

### Testing status (current)
- No test runner is configured in `package.json`.
- No `*.test.*` / `*.spec.*` files are present.
- `npm test` is currently unavailable.

### Running a single test (important)
Single-test execution is not possible yet because no framework is installed.

If Vitest is added:
```bash
npx vitest run path/to/file.test.ts
npx vitest run path/to/file.test.ts -t "test name"
```

If Jest is added:
```bash
npx jest path/to/file.test.ts
npx jest path/to/file.test.ts -t "test name"
```

Recommended scripts to add when a runner is introduced:
- `test`
- `test:watch`
- `test:single`

## Prisma and Database Commands
```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db push
npx prisma studio
```

Notes:
- Prisma config: `prisma.config.ts`.
- Schema file: `prisma/schema.prisma`.
- DB tasks require `DATABASE_URL`.

## Docker Commands
`docker-compose.yml` includes app, postgres, and minio services.

```bash
docker compose up --build
docker compose down
```

## Codebase Layout
- App routes/pages/layouts: `src/app/**`.
- API handlers: `src/app/api/**/route.ts`.
- Server actions: `src/actions/**`.
- Shared libraries/services: `src/lib/**`.
- Components: `src/components/**`.
- Prisma schema: `prisma/schema.prisma`.

## Code Style Guidelines
### General
- Use TypeScript and keep exported/public APIs typed.
- Respect strict typing (`strict: true` in `tsconfig.json`).
- Prefer small, composable functions.
- Keep changes minimal and task-focused.

### Imports
- Keep imports at file top.
- Prefer `@/...` alias imports for app code.
- Import order: external -> internal alias -> relative.
- Use `import type` where only type information is needed.

### Formatting
- No Prettier config is committed; preserve nearby style.
- Do not mass-reformat unrelated files.
- There are mixed styles in repo; follow file-local conventions.
- Common patterns:
  - app/business files often use single quotes + semicolons,
  - some generated shadcn/ui files use double quotes + no semicolons.

### Types
- Avoid `any`; prefer unions, generics, or `unknown` + narrowing.
- Reuse Prisma types where possible.
- Add explicit return types for non-trivial exported functions.
- For server actions, prefer structured results like `{ success, data?, error? }`.

### Naming
- Components: PascalCase (`RegulationList`, `UnifiedSearchBar`).
- Variables/functions: camelCase (`getFilteredRegulations`).
- Constants/env names: `UPPER_SNAKE_CASE`.
- Keep Prisma enum values uppercase (`ACTIVE`, `AMENDED`, `REVOKED`).
- Follow existing folder-level naming conventions for filenames.

### Error Handling
- Wrap async DB/network logic in `try/catch`.
- Log context: `console.error("message", error)`.
- Return safe user-facing error messages.
- Route handlers should return `NextResponse.json` with correct HTTP status.
- Server actions should return predictable result objects.

### Validation and Input Safety
- Validate external input using Zod (see `src/lib/validations.ts`).
- Treat request body/query params as untrusted.
- Parse numbers and dates defensively.

### Next.js and React
- Follow App Router conventions (`page.tsx`, `layout.tsx`, `route.ts`).
- Use `'use server';` in server-action files.
- Use `'use client';` only when client APIs/hooks are needed.
- Revalidate paths after mutations where needed (`revalidatePath`).

### Prisma Conventions
- Use shared client from `src/lib/prisma.ts` in app code.
- Keep query `include`/`orderBy`/filters explicit.
- Use transactions for multi-write atomic operations.
- Avoid obvious N+1 query patterns.

### Security
- Never commit `.env` or secret material.
- Never log tokens, passwords, API keys, or full DB URLs.
- Keep middleware/auth checks fail-safe.

## Agent Workflow
- Read adjacent files before editing to match architecture and style.
- Prefer small diffs scoped to the request.
- Run lint/build checks relevant to your change when feasible.
- If you add a new framework/tool (especially tests), update this file in the same change.

## Quick Hand-off Checklist
- Build succeeds: `npm run build`.
- Lint succeeds: `npm run lint`.
- Prisma/schema changes included for DB model changes.
- No secrets or generated junk accidentally staged.
