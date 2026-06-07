# Phase 3: Diff Engine Verification & Testing Pipeline - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 focuses on setting up the Vitest testing runner framework and implementing automated unit tests verifying the verbatim LCS diff engine (`src/lib/diff-engine.ts`).

</domain>

<decisions>
## Implementation Decisions

### Test File Location & Structure
- **D-01:** Place unit test files adjacent to the source code files they verify (e.g. `src/lib/diff-engine.test.ts`).

### Path Alias Support
- **D-02:** Configure Vitest to support TypeScript path aliases (`@/*`) so test imports match the application's import conventions.

### Test Coverage Scenarios
- **D-03:** Verify core LCS functionality, focusing on word-by-word additions, deletions, and equal parts under various string comparison scenarios.

### the agent's Discretion
- The exact layout of `vitest.config.ts` and selection of TS alias resolver plugin (e.g., `vite-tsconfig-paths` or resolve aliases) are left to agent discretion.
- The precise test cases and test assertions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Diff Engine
- `src/lib/diff-engine.ts` — Verbatim LCS diff engine implementation.

### Configuration
- `tsconfig.json` — TypeScript configuration containing `@/*` path mapping to `src/*`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/diff-engine.ts` -> `compareTexts(oldText, newText)`: Function to test.
- `src/lib/diff-engine.ts` -> `getDiffSummary(oldText, newText)`: Function to test.

### Integration Points
- `package.json`: Add dependency `vitest` and `vite-tsconfig-paths`, and define the `test` scripts.

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

*Phase: 03-Diff Engine Verification & Testing Pipeline*
*Context gathered: 2026-06-07*
