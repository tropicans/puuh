# Discussion Log: Phase 2 — PDF Parsing & OCR Processing Optimizations

This log documents the questions presented, options discussed, and final decisions locked for Phase 2.

## Areas Clarified

### 1. MinIO Download URL Resolution
- **Context:**Mismatches between the internal Docker endpoint (`minio:9000`) and browser-resolved localhost port (`9002`) cause broken PDF link generation.
- **Options presented:**
  - Option 1 (Recommended): Next.js API Proxy (`/api/documents/[...path]`) to abstract MinIO configuration from the browser.
  - Option 2: Public MinIO Environment Variable (e.g. `MINIO_PUBLIC_URL`) to directly link the browser to MinIO's mapped host port.
- **Decision:** Selected Option 1. We will serve document files through Next.js proxy route `/api/documents/[...path]`.

### 2. Vision OCR Concurrency Throttling
- **Context:** Parallelizing chunk uploads can overwhelm the LLM API limit. Throttling concurrent requests ensures rate-limit safety.
- **Options presented:**
  - Option 1: Limit to 3 concurrent requests and make it configurable via `OCR_CONCURRENCY_LIMIT` environment variable.
  - Option 2: Limit to 3 concurrent requests but keep it hardcoded in the codebase.
  - Option 3: Run all chunk requests in parallel without any throttling.
- **Decision:** Selected Option 1. Limit concurrency to 3, configurable via environment variable.

### 3. Regex Parser Hardening
- **Context:** Splitting Indonesian legislation articles requires matching variations of "Pasal" and alphanumeric numbering.
- **Options presented:**
  - Option 1: Go with the proposed hardening: match `Pasa[l1]`, `Pas\s*al`, double spaces, and alphanumeric article numbers like `103A`.
  - Option 2: Stick to standard matching: only match Pasal followed by a number, no typo handling.
- **Decision:** Selected Option 1. Implement regex typo tolerance and support alphanumeric suffixes like `103A`.

---

## Noted for Later (Deferred Ideas)

None.

## the agent's Discretion

- Choice of promise pool throttling helper implementation.
- Specific regex expression details for matching article divisions.
