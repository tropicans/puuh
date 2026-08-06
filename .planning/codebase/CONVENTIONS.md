# Coding Conventions

**Analysis Date:** 2026-06-10

## Naming Patterns

**Files:**
- Components: PascalCase (`RegulationList.tsx`, `UnifiedSearchBar.tsx`)
- Actions: lowercase with hyphens for relationships (`regulations.ts`, `users.ts`)
- Hooks: `use` prefix + PascalCase (`useAsyncAction.ts`, `useFlashMessage.ts`)
- Utilities: lowercase with hyphens (`diff-engine.ts`, `pdf-service.ts`, `data-service.ts`)
- Tests: `.test.ts` suffix, co-located in `src/__tests__/` directory

**Functions:**
- camelCase for regular functions (`compareTexts`, `getFilteredRegulations`, `parseArticlesFromText`)
- `handle` prefix for event handlers (`handleQuickCompare`, `handleSelectForMatrix`)
- `transform` prefix for data transformation functions (`transformRegulation`, `transformVersion`)
- `require` prefix for authorization guards (`requireAdmin`)

**Variables:**
- camelCase (`regulationId`, `year`, `fullTitle`, `effectiveDate`)
- Descriptive names: `parsedEffectiveDate`, `rateLimitKey`, `originalFileUrl`

**Types:**
- PascalCase for interfaces (`DiffResult`, `ArticleWithStatus`, `RegulationListItem`)
- PascalCase for enums (`VersionStatus`, `ArticleStatus`, `JudicialForum`, `JudicialOutcome`)
- Type suffix for explicit type exports (`ActionResult<T>`)

## Code Style

**Formatting:**
- No Prettier config is committed; preserve nearby style
- Mixed styles in repo; follow file-local conventions
- Common patterns:
  - App/business files use single quotes + semicolons (`'use server';`)
  - Some generated shadcn/ui files use double quotes + no semicolons

**Linting:**
- ESLint (v9) with `eslint-config-next`
- Config file: `.eslintrc.json` (not present - uses Next.js default config)
- Run: `npm run lint` or `npm run format`

## Import Organization

**Order:**
1. External dependencies (`react`, `next/server`, `zod`)
2. Internal alias imports (`@/lib/...`, `@/actions/...`, `@/components/...`)
3. Relative imports (not commonly used)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Example: `import { prisma } from '@/lib/prisma'`

## Error Handling

**Patterns:**
- Wrap async DB/network logic in `try/catch`
- Log context: `console.error("message", error)` or use `logger.error()`
- Return safe user-facing error messages
- Route handlers return `NextResponse.json` with appropriate HTTP status
- Server actions return predictable result objects: `{ success, data?, error? }`

**Error Response Structure (Route Handlers):**
```typescript
// On unauthorized
NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// On forbidden
NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

// On validation error
NextResponse.json(
    { success: false, error: 'Validation message' },
    { status: 400 }
);

// On not found
NextResponse.json({ error: 'Not found' }, { status: 404 });
```

**Error Response Structure (Server Actions):**
```typescript
interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Usage:
return { success: false, error: 'Gagal mengambil data' };
return { success: true, data: result };
```

## Logging

**Framework:** Custom logger (`@/lib/logger.ts`)

**Patterns:**
- Use `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
- Log with context and metadata: `logger.error('Error fetching regulations:', error)`
- Configured via `LOG_LEVEL` env var or `NODE_ENV`

## Comments

**When to Comment:**
- Explain WHY, not WHAT
- Document complex logic (e.g., LCS algorithm in diff-engine.ts)
- Note important constraints or tradeoffs

**JSDoc/TSDoc:**
- Used selectively on utility functions
- Example from `utils.ts`:
```typescript
/**
 * Clean extracted text to remove headers, footers, and page numbers
 */
export function cleanPdfText(text: string): string
```

## Function Design

**Size:**
- Prefer small, focused functions
- Example: `compareTexts()` (213 lines) is an exception due to algorithm complexity
- Route handlers are larger (100-350 lines) due to request/response handling

**Parameters:**
- Avoid more than 3-4 parameters
- Use objects for multiple parameters: `filters: RegulationFilters`
- TypeScript types for all parameters

**Return Values:**
- Explicit return types for non-trivial exported functions
- Server actions return structured results: `{ success, data?, error? }`

## Module Design

**Exports:**
- Named exports for utilities and hooks: `export function cn(...)`
- Default exports avoided for components (named export preferred)

**Barrel Files:**
- Components: barrel files in `components/index.ts` (if present)
- Lib: individual exports from each file

## Validation

**Framework:** Zod (v4.3.6)

**Patterns:**
- Define schemas in `src/lib/validations.ts`
- Use `safeParse()` in route handlers to catch validation errors
- Return user-friendly error messages from Zod
- Strict schemas with `.strict()` where appropriate

**Validation Pattern:**
```typescript
const payload = mySchema.safeParse(await request.json());
if (!payload.success) {
    return NextResponse.json(
        { success: false, error: payload.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
    );
}
```

## Database Access

**Prisma Patterns:**
- Use shared client from `@/lib/prisma.ts`
- Include related data explicitly in `include` options
- Use transactions for multi-write atomic operations
- Order results explicitly in `orderBy` options

**Example:**
```typescript
await prisma.regulationVersion.findUnique({
    where: { id },
    include: {
        regulation: { include: { type: true } },
        articles: { orderBy: { orderIndex: 'asc' } }
    }
});
```

## Next.js Specific

**App Router:**
- Server Components by default (`'use client';` only when needed)
- API routes in `src/app/api/[path]/route.ts`
- Pages in `src/app/[path]/page.tsx`
- Server actions in `src/actions/[name].ts`

**Server Actions:**
- Mark with `'use server';`
- Return structured results: `{ success, data?, error? }`
- Revalidate paths after mutations: `revalidatePath('/')`

**Auth:**
- Use `auth()` from `next-auth` via `@/lib/auth.ts`
- Check admin role: `isAdminRole(user.role)`
- Get current user: `await getCurrentUser()`

## Component Design

**Props:**
- TypeScript interfaces for all component props
- Required props without `?`
- Optional props with `?` and sensible defaults

**Styling:**
- Tailwind CSS v4 + shadcn/ui components
- Use `cn()` utility for conditional classes
- Consistent border radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Consistent padding: `p-4`, `p-6`, `p-8`

**Pattern:**
```tsx
export function MyComponent({ className, children }: { className?: string }) {
    return (
        <div className={cn('base-styles', className)}>
            {children}
        </div>
    );
}
MyComponent.displayName = 'MyComponent';
```

---

*Convention analysis: 2026-06-10*
