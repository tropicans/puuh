# Phase 3: Diff Engine Verification & Testing Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 3-Diff Engine Verification & Testing Pipeline
**Areas discussed:** Test File Location, Path Alias Support, Test Coverage Scenarios

---

## Test File Location

| Option | Description | Selected |
|--------|-------------|----------|
| Adjacent to source code | Place test files adjacent to the source code (e.g. `src/lib/diff-engine.test.ts`) | ✓ |
| Dedicated test folder | Group all tests under a dedicated folder (e.g. `tests/`) | |

**User's choice:** Adjacent to source code (e.g., `src/lib/diff-engine.test.ts`)
**Notes:** Recommends placing test files adjacent to the source file they verify.

---

## Path Alias Support

| Option | Description | Selected |
|--------|-------------|----------|
| Support @/* aliases | Configure path alias resolver so tests match application imports | ✓ |
| Relative paths only | Keep simple and resolve imports using relative paths in tests | |

**User's choice:** Configure path alias resolver so tests match application imports.
**Notes:** User chose to support `@/*` path alias mapping in tests.

---

## Test Coverage Scenarios

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim LCS verification | Verbatim word additions and deletions (Core LCS verification) | ✓ |
| Full tokenization verification | Whitespace and punctuation tokenization verification | |
| Boundary cases | Empty inputs, identical texts, case-sensitivity changes | |
| Performance verification | Performance checks under large text comparisons | |

**User's choice:** Verbatim word additions and deletions (Core LCS verification).
**Notes:** Focused on testing standard additions and deletions.

---

## the agent's Discretion

- Choice of Vitest configuration options.
- Selection of path alias resolver plugin (e.g., `vite-tsconfig-paths` or configure manually).

## Deferred Ideas

None.
