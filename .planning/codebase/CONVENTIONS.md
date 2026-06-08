# Coding Conventions

**Analysis Date:** 2026-06-08

## Naming Patterns

**Files:**
- Kebab-case for source files, utilities, Server Actions, and hooks (e.g. `ai-service.ts`, `useAsyncAction.ts`).
- PascalCase for React components (e.g. `RegulationSection.tsx`, `StatsSection.tsx`), except for base shadcn components which use kebab-case (`button.tsx`).
- Next.js routing files are strictly lower-case (`page.tsx`, `layout.tsx`, `route.ts`).

**Functions & Methods:**
- CamelCase for functions and variables (e.g. `getRegulations`, `parseArticlesFromText`).
- No special prefixes (e.g. no `async` prefix) for asynchronous functions.
- Event handlers are prefixed with `handle` (e.g. `handleSubmit`, `handleDelete`).

**Variables & Constants:**
- CamelCase for local variables.
- UPPER_SNAKE_CASE for environment variables and global configuration constants (e.g. `MODEL`, `MINIO_PORT`, `MIN_BOOTSTRAP_PASSWORD_LENGTH`).

**Types & Interfaces:**
- PascalCase for type aliases, interfaces, and classes.
- Avoid interface prefixes (e.g. `ActionResult`, not `IActionResult`).
- Enums are written in PascalCase with UPPER_CASE values (e.g. `VersionStatus.ACTIVE`, `VersionStatus.AMENDED`).

## Code Style

**Formatting:**
- Single quotes for strings in standard files; double quotes can be found in shadcn UI configurations.
- Semicolons are generally preferred at the end of statements in business files, but omitted in some shadcn component files.
- Indentation: 4 spaces in actions and some application routes; 2 spaces in components and configurations. Developers should preserve the existing file formatting conventions rather than reformatting.

**Linting:**
- Checked via ESLint (configured in `eslint.config.mjs`).
- Scripts: `npm run lint`.

## Import Organization

**Order:**
1. React and Next.js core imports.
2. Third-party packages (e.g. `zod`, `minio`, `@prisma/client`).
3. Path alias imports using `@/*` mapping to `src/*` (e.g. `@/lib/prisma`, `@/actions/regulations`).
4. Relative imports (e.g. `./utils`, `../types`).
5. Type-only imports (e.g. `import type { User } from 'next-auth'`).

**Grouping:**
- Blank lines separation between groups.
- Path aliases are highly preferred over relative imports for files nested more than 1 level deep.

## Error Handling

**Patterns:**
- Try/catch blocks around database queries, LLM completions, and external API requests.
- Server Actions return a standardized `ActionResult<T>` structure: `{ success: boolean; data?: T; error?: string }` instead of throwing exceptions directly to the UI.
- API Route handlers return descriptive `NextResponse.json({ error: 'Message' }, { status: HTTP_STATUS })`.

**Logging:**
- Server-side errors must be logged with contextual descriptions: `console.error('Error fetching regulations:', error)`.
- No user credentials, session tokens, or raw database credentials should ever be logged.

## Comments

**Guidelines:**
- Focus comments on *why* logic is implemented a certain way rather than *what* it is doing (e.g. `// Split PDF into smaller chunks if > 1MB or > 5 pages`).
- Document AI/LLM system prompts clearly to show the required format and target responses.
- TODO comments format: `// TODO: description` or `// Legacy/Fallback: ...`.

## Function & Module Design

**Guard Clauses:**
- Use early return statements and guard clauses to reduce nesting depth.
  ```typescript
  if (!user) {
      return { success: false, error: 'Unauthorized' };
  }
  ```

**Exports:**
- Named exports are preferred for server action modules, helper libraries, and models.
- Default exports are used for the Prisma client singleton, NextAuth config, and Next.js pages/layouts.

---

*Convention analysis: 2026-06-08*
*Update when patterns change*
