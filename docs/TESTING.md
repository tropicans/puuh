<!-- generated-by: gsd-doc-writer -->
# Testing

**Analysis Date:** 2026-08-07

This document outlines the testing framework, structure, and execution instructions for the PUU Tracker application.

## Test Framework and Setup

Testing is implemented in both workspaces:
- **Runner:** Vitest v4.1.8
- **Configuration:** Configured separately in `frontend/vitest.config.ts` and `backend/vitest.config.ts`.
- **Assertion:** Vitest built-in matchers (`toBe`, `toEqual`, `toThrow`).

No extra database configuration is required for unit tests because external services and Prisma client queries are mocked.

## Running Tests

### Unit Tests
You can execute unit tests across the monorepo workspaces or target specific packages:

```bash
# Run all unit tests
npm run test

# Run backend unit tests only
npm run test --workspace=backend

# Run frontend unit tests only
npm run test --workspace=frontend

# Run tests in watch mode
npx vitest
```

### E2E Smoke Flow Tests
To verify full E2E orchestration (Next.js client connecting to Express API, database migrations, and MinIO storage file piping):
```bash
npm run smoke
```
This runs the automated script `scripts/smoke-flow.mjs` against the Dockerized containers stack.

## Writing New Tests

- **Conventions:** Test files should be placed in `__tests__/` subdirectories adjacent to the target module files and named as `*.test.ts`.
- **Cleanup:** Always include `vi.restoreAllMocks()` in an `afterEach` hook to prevent mock states leaking between test suites.
- **Mocking External Services:** Use `vi.mock()` at the top of the test file to mock external modules like `@/lib/api`, `openai`, `minio`, or Prisma Client interfaces.

Example of standard test structure:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processDocument } from './my-service';

vi.mock('./my-service', () => ({
  processDocument: vi.fn()
}));

describe('processDocument', () => {
  it('should parse content correctly', async () => {
    const mockProcess = vi.mocked(processDocument);
    mockProcess.mockResolvedValue({ success: true });

    const result = await processDocument('input');
    expect(result.success).toBe(true);
  });
});
```

## Coverage Requirements

- **Targets:** No strict minimum threshold is currently enforced.
- **Priority:** Coverage focuses on core processing algorithms (PDF extractors fallback logic, LLM parser matching engine, and authentication middlewares).

---

*Testing analysis: 2026-08-07*
