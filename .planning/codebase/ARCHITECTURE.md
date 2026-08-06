<!-- refreshed: 2026-06-10 -->
# Architecture

**Analysis Date:** 2026-06-10

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router Layer                  │
├──────────────────┬──────────────────┬───────────────────────┤
│   `/app/` pages  │   `/actions/`    │  `/lib/` services     │
│  `page.tsx`      │  Server actions  │  Data layer, utilities│
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma)                       │
│         `src/lib/prisma.ts`                                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                         │
│  `prisma/schema.prisma`                                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Authentication** | NextAuth credentials provider with rate limiting | `src/lib/auth.ts` |
| **Authorization** | User role checks (ADMIN/VIEWER) | `src/lib/authorization.ts` |
| **Data Service** | Database queries and filtering | `src/lib/data-service.ts` |
| **PDF Processing** | Text extraction via pdfjs/pdf-parse/OCR | `src/lib/pdf-service.ts` |
| **AI Service** | Article parsing and change analysis with LLM | `src/lib/ai-service.ts` |
| **Storage** | MinIO file storage integration | `src/lib/storage.ts` |
| **Diff Engine** | Verbatim text comparison for article changes | `src/lib/diff-engine.ts` |
| **Validations** | Zod schemas for input validation | `src/lib/validations.ts` |

## Pattern Overview

**Overall:** Layered Architecture with Server-First Rendering

**Key Characteristics:**
- **App Router pattern**: Server Components by default, Client Components only for interactivity
- **Server Actions pattern**: Form submissions and mutations via `actions/` directory
- **Streaming responses**: Upload processing via Server-Sent Events (SSE)
- **Direct database access**: Prisma used throughout app code
- **Type-safe API routes**: `next/server` with typed request/response

## Layers

### Presentation Layer
- **Purpose**: UI rendering, user interaction, state management
- **Location**: `src/app/`, `src/components/`
- **Contains**: Page components, layout wrappers, UI components (shadcn/ui), hooks
- **Depends on**: Actions, API routes, hooks
- **Used by**: Browser

### Business Logic Layer
- **Purpose**: Server-side operations, validation, authorization
- **Location**: `src/actions/`, `src/lib/`
- **Contains**: Server actions, data services, utility functions, validation schemas
- **Depends on**: Prisma, external services (MinIO, LLM)
- **Used by**: API routes, Client components (via actions)

### Data Layer
- **Purpose**: Database abstraction and queries
- **Location**: `src/lib/prisma.ts`, `prisma/`
- **Contains**: Prisma client singleton, schema definitions
- **Depends on**: PostgreSQL (via pg pool)
- **Used by**: Data services, API routes, actions

### Infrastructure Layer
- **Purpose**: External service integration
- **Location**: `src/lib/pdf-service.ts`, `src/lib/ai-service.ts`, `src/lib/storage.ts`
- **Contains**: PDF extraction, AI/LLM calls, MinIO client
- **Depends on**: External APIs (OpenAI, Google Vision, MinIO)

## Data Flow

### Primary Request Path

1. **Incoming Request** → Next.js App Router route handler (`src/app/api/*/route.ts`)
2. **Authorization Check** → `getCurrentUser()` from `src/lib/authorization.ts`
3. **Business Logic** → Server action or data service function
4. **Database Query** → Prisma client from `src/lib/prisma.ts`
5. **Response** → `NextResponse.json` with data or error

### Upload Flow (Server-Sent Events)

1. **Client Upload** → `POST /api/upload` (`src/app/api/upload/route.ts`)
2. **Validation** → Zod schema validation
3. **Text Extraction** → `smartExtractPdfText()` in `src/lib/pdf-service.ts`
   - Fallback chain: pdfjs → pdf-parse → OCR (Google Vision)
4. **Article Parsing** → `parseArticlesFromText()` in `src/lib/ai-service.ts`
5. **Database Transaction** → Create regulation, version, and articles atomically
6. **MinIO Upload** → Store original PDF file
7. **Progress Updates** → SSE stream with `{ type: 'progress' }` messages
8. **Success Response** → `{ type: 'success', data: {...} }`

### Comparison Flow

1. **Matrix View** → `MatrixComparisonView` in `src/components/comparison/MatrixComparisonView.tsx`
2. **Version Collection** → Fetch all versions for a regulation
3. **Article Alignment** → Match articles by number across versions
4. **Diff Calculation** → `compareTexts()` from `src/lib/diff-engine.ts`
5. **Status Determination** → `same`, `modified`, `new`, `inherited`
6. **Rendering** → Highlight changes with color-coded badges

## Key Abstractions

**Regulation**:
- Purpose: Represents a subject area (e.g., "Jaminan Kesehatan") with multiple versions
- Examples: `prisma/schema.prisma#L23`, `src/lib/data-service.ts#L12`
- Pattern: Aggregate root with one-to-many relation to `RegulationVersion`

**RegulationVersion**:
- Purpose: A specific iteration of a regulation (e.g., "Perpres No. 82 Tahun 2018")
- Examples: `prisma/schema.prisma#L39`, `src/lib/ai-service.ts#L161`
- Pattern: Self-referential for amends relationship

**Article**:
- Purpose: Individual pasal within a regulation version
- Examples: `prisma/schema.prisma#L75`, `src/lib/diff-engine.ts#L4`
- Pattern: Child of version with status tracking

**Diff Result**:
- Purpose: Verbatim comparison of article text
- Examples: `src/lib/diff-engine.ts#L9`
- Pattern: Word-by-word LCS algorithm with equal/insert/delete parts

## Entry Points

**App Entry Point**:
- Location: `src/app/page.tsx`
- Triggers: Root route `/`
- Responsibilities: Renders landing page with auth check

**Layout Entry Point**:
- Location: `src/app/layout.tsx`
- Triggers: All routes
- Responsibilities: Wraps app with ThemeProvider, AppShell, auth-based navigation

**API Routes**:
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth handlers
- `src/app/api/regulations/route.ts`: GET list of regulations
- `src/app/api/regulations/[id]/route.ts`: GET single regulation with all versions
- `src/app/api/upload/route.ts`: POST new regulation with streaming SSE response

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; no worker threads
- **Global state:** Prisma client uses global singleton pattern in `src/lib/prisma.ts#L17`
- **Circular imports:** None detected; dependency flow: UI → Actions → Lib → Prisma
- **Authentication:** JWT-based session strategy with credentials provider
- **Styling:** Tailwind CSS v4 with custom config; component libraries use inline styles where needed

## Anti-Patterns

### No Database Abstraction Layer

**What happens:** App code calls `prisma.*` directly in API routes and server actions.

**Why it's wrong:** This tightly couples business logic to database schema. Changing the schema requires updates across many files.

**Do this instead:** Create a repository pattern in `src/repositories/` that abstracts Prisma calls:
```typescript
// src/repositories/regulationRepository.ts
export async function findById(id: string) {
  return prisma.regulation.findUnique({ where: { id } });
}
```
Reference: `src/lib/data-service.ts` provides partial abstraction but is incomplete.

### Large File Sizes

**What happens:** Some files exceed 400+ lines (e.g., `src/actions/regulations.ts:489`, `src/app/api/upload/route.ts:355`).

**Why it's wrong:** Multi-responsibility files are harder to test and maintain.

**Do this instead:** Split by concern:
- `src/actions/regulation-actions.ts` (CRUD)
- `src/actions/version-actions.ts` (version management)
- `src/actions/article-actions.ts` (article management)

## Error Handling

**Strategy:** Try-catch with user-friendly messages; console.error for debugging.

**Patterns:**
- API routes return `NextResponse.json({ success: false, error: message }, { status })`
- Server actions return `{ success: boolean, data?: T, error?: string }`
- Database errors logged with context

## Cross-Cutting Concerns

**Logging:** Custom `logger` in `src/lib/logger.ts` with level filtering and timestamp formatting.

**Validation:** Zod schemas in `src/lib/validations.ts`; used in API routes and server actions.

**Authentication:** NextAuth credentials provider with rate limiting via `LRUCache` in `src/lib/auth.ts#L15`.

**Authorization:** Role-based access control (ADMIN/VIEWER) with `getCurrentUser()` and `isAdminRole()`.

---

*Architecture analysis: 2026-06-10*
