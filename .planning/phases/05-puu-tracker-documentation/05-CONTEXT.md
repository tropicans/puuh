# Phase 5: PUU Tracker Documentation - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Source:** Manual definition for Milestone v1.2 Documentation

<domain>
## Phase Boundary

This phase delivers comprehensive documentation for the PUU Tracker application. All files must be placed in the `docs` folder at the root of the project.

</domain>

<decisions>
## Implementation Decisions

### Target Files & Structure
- **User Guide (`docs/user-guide.md`)**:
  - Detailed explanations of features: PDF Upload (via admin flow), Verbatim comparison, Article parsing, and version timeline tracking.
  - UI walkthrough and screenshots.
- **Developer Guide (`docs/developer-guide.md`)**:
  - Codebase layouts, component directory, and database schemas.
  - Integration of Prisma ORM, PostgreSQL database, and MinIO object storage.
  - Guide for adding new features or modifying the parser/diff-engine.
- **System Architecture & Data Flow (`docs/architecture.md`)**:
  - Technical design of the Verbatim LCS Diff Engine (tokenization, LCS alignment, backtracking).
  - Text extraction pipeline details (Digital PDF extraction -> Scanned PDF Vision OCR fallback).
- **API Specification (`docs/api-specification.md`)**:
  - API endpoint descriptions (Upload, authentication, etc.).
  - Request/Response validation structures (Zod schemas).
  - Middleware and authorization guards (Admin role checks).
- **Deployment & Operations (`docs/deployment.md`)**:
  - Docker Compose setup, PostgreSQL, and MinIO service definitions.
  - Prisma migration flow and seed scripts.
  - Environment variables guide.

</decisions>

<canonical_refs>
## Canonical References

- [AGENTS.md](file:///c:/Users/X1%20Carbon/Downloads/Projects/self-hosted-ai-starter-kit/Dev/puu/AGENTS.md)
- [GEMINI.md](file:///c:/Users/X1%20Carbon/Downloads/Projects/self-hosted-ai-starter-kit/Dev/puu/GEMINI.md)

</canonical_refs>

<specifics>
## Specific Ideas
- Generate clear code snippets and CLI command examples.
- Document step-by-step instructions for troubleshooting common local development/deployment issues.

</specifics>

<deferred>
## Deferred Ideas
- Inline code comments / JSDoc auto-generation (kept out of scope; focus is on external markdown documentation).

</deferred>
