# Phase 1: Environment & Authentication Security Stabilization - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 focuses on environment alignment, database schema migration safety, page-level role guards, and environment-based seeding. It aligns configuration files and secures access to administrative page views without introducing new user features.

</domain>

<decisions>
## Implementation Decisions

### Page Guard UI Treatment
- **D-01:** Automatically redirect unauthenticated or non-admin users to the `/login` page when they attempt to visit the `/upload` or `/manage` views.

### Database Port Resolution
- **D-02:** Align the `.env` database connection string port to `5434` (matching the mapped host port in `docker-compose.yml`) so that local host development runs smoothly alongside the docker containers.

### Seed Credentials Storage
- **D-03:** Load default seed passwords for admin/viewer accounts from `SEED_ADMIN_PASSWORD` and `SEED_VIEWER_PASSWORD` environment variables in `.env` instead of hardcoding them in the codebase.

### Prisma Initial Migration Setup
- **D-04:** Generate and commit a standard initial migration schema named `init_schema` via Prisma to keep database schema changes version-controlled.

### the agent's Discretion
- The implementation of the NextAuth page redirect and exact error handling details are left to agent discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Configuration
- `prisma/schema.prisma` — Current PostgreSQL data model schema.
- `docker-compose.yml` — Container mapping and environment definitions.
- `.env` — Local environment variables configuration.

### Authentication & Pages
- `src/actions/users.ts` — Admin and viewer seed actions.
- `src/app/upload/page.tsx` — Admin document upload view page.
- `src/app/manage/page.tsx` — Admin management view page.
- `src/lib/auth.ts` — NextAuth configurations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/authorization.ts` -> `getCurrentUser()` and `isAdminRole()`: Use these functions to retrieve session information and verify if the user has admin role access.
- `src/lib/prisma.ts` -> `prisma`: Use this global prisma client for all database operations.

### Established Patterns
- Server actions should continue returning `ActionResult<T>` (defined as `{ success: boolean; data?: T; error?: string }`).
- NextAuth session handling (using JWT strategy) is defined in `src/lib/auth.ts`.

### Integration Points
- `src/actions/users.ts` (seed action endpoint).
- `src/app/upload/page.tsx` and `src/app/manage/page.tsx` (page-level layouts).
- `.env` and `docker-compose.yml` configuration ports.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Environment & Authentication Security Stabilization*
*Context gathered: 2026-06-07*
