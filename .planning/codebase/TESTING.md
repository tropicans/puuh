# Testing Patterns

**Analysis Date:** 2026-06-10

## Test Framework

**Runner:**
- Vitest (v4.1.8)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (uses Chai assertions via `expect`)

**Run Commands:**
```bash
npm test                  # Run all tests (vitest run)
npm run test:watch       # Watch mode (vitest)
npm run build            # Build production app
npm run lint             # Lint codebase
```

**Configuration (`vitest.config.ts`):**
```typescript
export default defineConfig({
    test: {
        environment: 'node',
        globals: true,  // Use global describe/it/expect
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

## Test File Organization

**Location:**
- Tests co-located with source in `src/__tests__/` directory
- Test files: `*.test.ts`
- Example: `src/__tests__/validation.test.ts`

**Naming:**
- `<module-name>.test.ts`
- Examples:
  - `validation.test.ts`
  - `authorization.test.ts`
  - `utils.test.ts`
  - `diff-engine.test.ts`

**Structure:**
```
src/__tests__/
├── validation.test.ts
├── authorization.test.ts
├── utils.test.ts
└── diff-engine.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/module';

describe('module description', () => {
    it('handles happy path', () => {
        const result = myFunction('input');
        expect(result).toBe('expected');
    });

    it('handles edge case', () => {
        const result = myFunction('');
        expect(result).toBe('default');
    });
});
```

**Patterns:**
- `describe()` for grouping related tests
- `it()` for individual test cases with descriptive names
- `expect(value).toBe()` for assertions
- Use `true`/`false` comparisons for booleans: `expect(result.success).toBe(true)`

**Setup Pattern:**
- Import test subject at top of file
- No `beforeEach`/`afterEach` commonly used
- Each test is independent

## Mocking

**Framework:** Vitest built-in (`vi`)

**Patterns:**
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/module', () => ({
    myFunction: vi.fn(),
}));

// In test:
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));
```

**What to Mock:**
- External dependencies (database, APIs, services)
- Next.js modules (`next-auth`, `next/cache`)
- File system operations
- Rate limiters

**What NOT to Mock:**
- Pure utility functions (e.g., `cn()`, `formatDate()`)
- Simple validation schemas
- State-less transformation functions

**Example Mock (authorization.test.ts):**
```typescript
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

import { isAdminRole } from '@/lib/authorization';

describe('isAdminRole', () => {
    it('returns true for ADMIN', () => {
        expect(isAdminRole('ADMIN')).toBe(true);
    });
});
```

## Fixtures and Factories

**Test Data:**
- Test data embedded directly in tests
- No separate fixture files or factories

**Location:**
- Inline in test cases

**Example:**
```typescript
it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ 
        email: 'admin@test.com', 
        password: '123456' 
    });
    expect(result.success).toBe(true);
});
```

## Coverage

**Requirements:** Not configured

**View Coverage:**
Vitest supports coverage but not configured:
```bash
# Would require config:
# npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions and modules
- **Approach:** Direct function calls with mocked dependencies
- **Files:** `src/__tests__/*.test.ts`

**Integration Tests:**
- **Scope:** API routes and database interactions
- **Approach:** Full HTTP request flow
- **Note:** Limited integration test coverage

**E2E Tests:**
- **Framework:** Not used
- **Status:** No E2E test framework configured

## Common Patterns

**Async Testing:**
```typescript
it('handles async operation', async () => {
    const result = await myAsyncFunction();
    expect(result).toBeDefined();
});
```

**Error Testing:**
```typescript
it('throws error for invalid input', () => {
    expect(() => myFunction('invalid')).toThrow();
});

// For Zod validation:
it('rejects invalid data', () => {
    const result = mySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
});
```

**Promise Resolution Testing:**
```typescript
it('returns successful result', async () => {
    const result = await myAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
});

it('handles error case', async () => {
    const result = await myAction();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
});
```

**State Management Testing:**
```typescript
it('compares identical texts', () => {
    const result = compareTexts('same text', 'same text');
    expect(result.hasChanges).toBe(false);
});

it('detects additions', () => {
    const result = compareTexts('original', 'original and more');
    expect(result.addedCount).toBeGreaterThan(0);
    expect(result.hasChanges).toBe(true);
});

it('detects deletions', () => {
    const result = compareTexts('original text', 'original');
    expect(result.deletedCount).toBeGreaterThan(0);
    expect(result.hasChanges).toBe(true);
});
```

**Validation Testing (Zod):**
```typescript
// Test valid input:
const result = schema.safeParse(validData);
expect(result.success).toBe(true);

// Test invalid input:
const result = schema.safeParse(invalidData);
expect(result.success).toBe(false);

// Test required fields:
expect(schema.safeParse({}).success).toBe(false);

// Test strict schema:
expect(schema.safeParse({ ...validData, extra: 'field' }).success).toBe(false);
```

## Testing Reference Examples

**Diff Engine Tests (`diff-engine.test.ts`):**
```typescript
describe('compareTexts', () => {
    it('detects no change', () => {
        const result = compareTexts('Pasal 1 sama', 'Pasal 1 sama');
        expect(result.hasChanges).toBe(false);
    });

    it('detects additions', () => {
        const result = compareTexts('Pasal 1', 'Pasal 1 telah diubah');
        expect(result.addedCount).toBeGreaterThan(0);
        expect(result.hasChanges).toBe(true);
    });

    it('returns diff parts array', () => {
        const result = compareTexts('kalimat pertama.', 'kalimat kedua.');
        expect(Array.isArray(result.parts)).toBe(true);
        expect(result).toHaveProperty('hasChanges');
        expect(result).toHaveProperty('addedCount');
        expect(result).toHaveProperty('deletedCount');
    });
});
```

**Validation Tests (`validation.test.ts`):**
```typescript
describe('loginSchema', () => {
    it('accepts valid email and password', () => {
        const result = loginSchema.safeParse({ 
            email: 'admin@test.com', 
            password: '123456' 
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
        const result = loginSchema.safeParse({ 
            email: 'not-email', 
            password: '123456' 
        });
        expect(result.success).toBe(false);
    });
});

describe('uploadSchema', () => {
    it('requires regulationType', () => {
        const result = uploadSchema.safeParse({
            number: '82',
            year: '2018',
        });
        expect(result.success).toBe(false);
    });
});
```

**Utility Tests (`utils.test.ts`):**
```typescript
describe('cn', () => {
    it('merges class names', () => {
        expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'hidden', 'active')).toBe('base active');
    });

    it('resolves tailwind conflicts', () => {
        expect(cn('px-4', 'px-2')).toBe('px-2');
    });
});
```

**Authorization Tests (`authorization.test.ts`):**
```typescript
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('isAdminRole', () => {
    it('returns true for ADMIN', () => {
        expect(isAdminRole('ADMIN')).toBe(true);
    });

    it('returns false for VIEWER', () => {
        expect(isAdminRole('VIEWER')).toBe(false);
    });

    it('returns false for null', () => {
        expect(isAdminRole(null)).toBe(false);
    });
});
```

---

*Testing analysis: 2026-06-10*
