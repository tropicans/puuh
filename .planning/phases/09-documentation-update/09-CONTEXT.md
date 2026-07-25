# Phase 9: Documentation Update - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and update system documentation to include details about the Automatic Regulation Fetcher and the Pasal.id API fallback.

This phase is strictly concerned with updating documentation markdown files (`docs/api-specification.md`, `docs/architecture.md`, `docs/deployment.md`, `docs/developer-guide.md`, and `docs/user-guide.md`) to reflect the fetcher and fallback implementations. No functional code changes are within the scope of this phase.

</domain>

<decisions>
## Implementation Decisions

### API Stream Format Details
- **D-01:** Comprehensive API spec will be added to `docs/api-specification.md`. This will cover request JSON parameters, HTTP status codes, chunked stream headers, and complete JSON schema examples for each event type (progress, success, error).

### Architecture Diagrams
- **D-02:** A visual Mermaid flowchart illustrating the 4-stage fetching pipeline and its fallback paths, accompanied by descriptive text, will be added to `docs/architecture.md`.

### Configuration & Fallback Status
- **D-03:** Document `PASAL_ID_TOKEN` as an optional but highly recommended environment variable in both `docs/deployment.md` and `docs/developer-guide.md`.
- **D-04:** Explain the removal of the dead Setkab crawler and how the Pasal.id fallback ensures high fetcher reliability when the primary JDIH BPK crawler is unavailable or rate-limited.

### User Guide Placement
- **D-05:** Add a dedicated section in `docs/user-guide.md` titled 'Automatic Regulation Fetching (Admin Flow)' describing the automatic search-to-import process.
- **D-06:** Add a cross-reference in the 'Dashboard Overview' section under the search bar capabilities to instruct users on search-to-fetch usage.

### the agent's Discretion
- The agent has discretion on the specific layout and phrasing of the updated sections in all markdown files, provided the decisions above are fully satisfied.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### System Documentation Files
- `docs/api-specification.md` — API Specification document to update.
- `docs/architecture.md` — System Architecture & Data Flow document to update.
- `docs/deployment.md` — Deployment & Operations Guide to update.
- `docs/developer-guide.md` — Developer Guide to update.
- `docs/user-guide.md` — User Guide to update.

### Source Reference Files
- `src/app/api/regulations/fetch/route.ts` — The fetch API endpoint implementation.
- `src/lib/regulation-fetcher.ts` — The fetcher service implementation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/regulation-fetcher.ts`: Implements the 4-stage search/fetching strategies pipeline (`searchBPK`, `generatePossibleUrls`, `searchWithAI`, `fetchFromPasalId`).
- `src/app/api/regulations/fetch/route.ts`: Implements the API handler, input validation via `parseRegulationInput`, NextAuth role checks, and SSE-like progress streaming.

### Established Patterns
- Existing documentation guides follow a clean, consistent Markdown structure with code blocks, mermaid flowcharts, and lists.
- Stream chunk format: JSON object followed by a newline character (`\n`), returned with `Content-Type: text/plain`.

### Integration Points
- `docs/api-specification.md`: Add a new endpoint documentation section for `POST /api/regulations/fetch`.
- `docs/architecture.md`: Add description and Mermaid diagram to section 2 (or a new section).
- `docs/deployment.md` and `docs/developer-guide.md`: Update Environment Configuration template and settings.
- `docs/user-guide.md`: Integrate fetcher usage guidelines.

</code_context>

<specifics>
## Specific Ideas

- Ensure that the Mermaid flowchart accurately details the fallback order: Strategy 1 (BPK search) -> Strategy 2 (Direct URLs) -> Strategy 3 (LLM AI search) -> Strategy 4 (Pasal.id fallback).
- Example payloads in `docs/api-specification.md` should match actual responses from `src/app/api/regulations/fetch/route.ts`.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Documentation Update*
*Context gathered: 2026-07-25*
