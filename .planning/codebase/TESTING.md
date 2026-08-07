# Testing Patterns

**Analysis Date:** 2026-08-07

## Test Framework

**Runner:**
- Vitest v4.1.8
- Config files: `frontend/vitest.config.ts` and `backend/vitest.config.ts`.

**Assertion Library:**
- Vitest built-in expect matcher library.
- Matchers used: `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalled`, `toHaveBeenCalledWith`, `rejects.toThrow`.

**Run Commands:**
Run from monorepo root:
```bash
npm run test                               # Run tests across all workspaces
npm run test --workspace=backend           # Run backend tests only
npm run test --workspace=frontend          # Run frontend tests only
node scripts/smoke-flow.mjs                # Run end-to-end integration smoke flow
```

## Test File Organization

**Location:**
- Test files are located in dedicated `__tests__` folders under `frontend/src/` and `backend/src/` directories.

**Naming:**
- Unit and integration tests: `*.test.ts` (e.g. `authorization.test.ts`, `diff-engine.test.ts`).
- E2E smoke tests: `scripts/smoke-flow.mjs`.

**Structure:**
```
frontend/src/
  __tests__/
    authorization.test.ts
    diff-engine.test.ts
    utils.test.ts
    validation.test.ts
backend/src/
  __tests__/
    (backend test files)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // setup test state or mock setups
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should complete expected behavior', () => {
      // arrange
      const input = 'test-input';

      // act
      const result = functionName(input);

      // assert
      expect(result).toBe('expected-result');
    });
  });
});
```

**Patterns:**
- Clear use of `describe` blocks corresponding to files and internal method names.
- Cleanups executed inside `afterEach` via `vi.restoreAllMocks()`.

## Mocking

**Framework:**
- Vitest built-in mocking utilities (`vi`).
- Module level mocks declared at the top level of test files via `vi.mock()`.

**Patterns:**
```typescript
import { vi } from 'vitest';
import { fetchFromBackend } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchFromBackend: vi.fn()
}));

// Inside tests
const mockFetch = vi.mocked(fetchFromBackend);
mockFetch.mockResolvedValue({ success: true, data: [] });
```

**What to Mock:**
- Database queries (Prisma Client queries).
- External network HTTP endpoints (MinIO client, Docling conversions, Vision model calls).
- NextAuth sessions and authorization cookie headers.

**What NOT to Mock:**
- Pure comparison functions (e.g., diff engines in `diff-engine.ts`).
- General utility functions.

## Fixtures and Factories

**Test Data:**
- Handled via inline mocks or JSON fixtures representing legal regulations, versions, and lists of articles.

## Coverage

**Requirements:**
- No strict minimum coverage threshold enforced currently.
- Testing focused on critical core algorithms (e.g., text parsing, diff engines, and authentication checks).

## Test Types

**Unit Tests:**
- Test individual library functions, parser logic, and middlewares in isolation. Mock database/network responses.
- Active in `frontend` (52 tests) and `backend` (17 tests).

**E2E Smoke Tests:**
- Scripted workflow `scripts/smoke-flow.mjs` verifying authentication cookie parsing, CSRF checks, and multi-part upload redirection in the live Docker Compose environment.

---

*Testing analysis: 2026-08-07*
*Update when test patterns change*
