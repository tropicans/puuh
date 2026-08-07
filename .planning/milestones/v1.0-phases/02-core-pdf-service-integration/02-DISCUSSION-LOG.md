# Phase 2: Core PDF Service Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 2-Core PDF Service Integration
**Areas discussed:** Fallback Strategy & Timeout, API Request & Parameters, Progress & Logging

---

## Fallback Strategy & Timeout

### Q1: What should be the timeout limit for the Docling service call before falling back to pdfjs/pdf-parse?
| Option | Description | Selected |
|--------|-------------|----------|
| 15 seconds | (Recommended) Balance between giving Docling enough time to process typical legal PDFs and not making the user wait too long on failure. | ✓ |
| 30 seconds | Better for very large or complex PDFs, but increases user wait time if the service is hanging. | |
| 5 seconds | Fast fallback, but might cut off legitimate Docling conversions on larger files. | |
| You decide | Let the agent decide. | |

### Q2: Under what response conditions should we trigger the fallback chain?
| Option | Description | Selected |
|--------|-------------|----------|
| Network errors, timeouts, and non-200 HTTP statuses | (Recommended) Ensures any service-level failure immediately tries pdfjs/pdf-parse. | ✓ |
| Network errors and timeouts only | If Docling actively returns a 4xx/5xx error (like invalid PDF), we fail fast instead of attempting other methods. | |
| Include empty/low character count output | If Docling succeeds but returns fewer than 200 characters, also fallback to the next method. | |
| You decide | Let the agent decide. | |

### Q3: Should we check docling-serve's health endpoint (/health) dynamically before each PDF upload, or just try the request and catch failures?
| Option | Description | Selected |
|--------|-------------|----------|
| Direct call with error catch | (Recommended) Faster (saves a round-trip per upload) and handles transient service downtime during the conversion itself. | ✓ |
| Pre-check /health | Query health endpoint first. If unhealthy/offline, immediately bypass Docling and use fallback. | |
| You decide | Let the agent decide. | |

### Q4: If the fallback is triggered, should we log the specific Docling error details to server logs or keep it silent?
| Option | Description | Selected |
|--------|-------------|----------|
| Log full error details | (Recommended) Output specific reason (timeout, connection refused, status code) to server logs while proceeding with fallback silently for the user. | ✓ |
| Log brief warning only | Log a single warning line without stack traces to keep logs clean. | |
| Silence errors | Proceed to fallback without logging anything about Docling failures. | |
| You decide | Let the agent decide. | |

---

## API Request & Parameters

### Q1: Which endpoint of docling-serve should we call for document conversion?
| Option | Description | Selected |
|--------|-------------|----------|
| /v1/convert/file | (Recommended) Direct file upload via multipart/form-data. This runs conversion synchronously and returns the converted contents directly. | ✓ |
| /v1/convert/file/async | Submit conversion task, poll for status, and retrieve results. More complex but handles very long conversions without connection timeout. | |
| You decide | Let the agent decide. | |

### Q2: Which output formats should we request from docling-serve?
| Option | Description | Selected |
|--------|-------------|----------|
| to_formats: ['md'] | (Recommended) Instructs Docling to only output Markdown. This minimizes payload size and processing overhead. | ✓ |
| to_formats: ['md', 'json'] | Request both formats (Markdown for text, JSON for structured parsing data) in case we need elements metadata later. | |
| Default parameters | Let Docling serve decide the defaults (which defaults to Markdown format). | |
| You decide | Let the agent decide. | |

### Q3: Should we configure OCR parameters in the Docling request?
| Option | Description | Selected |
|--------|-------------|----------|
| Default microservice settings | (Recommended) Let Docling automatically run OCR on scanned/un-extractable pages based on its internal rules. | ✓ |
| Force OCR (do_ocr=true, force_ocr=true) | Force Docling to run OCR on all pages, regardless of digital text presence. | |
| Disable OCR (do_ocr=false) | Completely disable OCR to speed up conversion and reduce CPU usage (falls back to existing OCR service if needed). | |
| You decide | Let the agent decide. | |

### Q4: How should we build the multipart request in the Next.js backend?
| Option | Description | Selected |
|--------|-------------|----------|
| Use standard Node 20+ global FormData and Fetch | (Recommended) Use standard Node 20+ global FormData and Fetch: Direct, native, and clean without importing external packages. | ✓ |
| Use dynamic import of form-data package | Use dynamic import of form-data package: If we need support for older Node versions or custom headers, but adds dependency overhead. | |
| You decide | Let the agent decide. | |

---

## Progress & Logging

### Q1: What progress messages should we push to the frontend stream when using Docling?
| Option | Description | Selected |
|--------|-------------|----------|
| 'Mencoba membaca teks menggunakan Docling...' at start and 'Teks berhasil diekstrak (docling): X karakter' on success | (Recommended) Informative and clearly distinguishes Docling from other methods. | ✓ |
| Generic progress messages | Keep progress messages identical to existing ones ('Mencoba membaca teks digital...', 'Teks berhasil diekstrak...') to hide extraction method detail from standard users. | |
| Detailed progress | Log 'Mengirim file ke docling-serve di http://docling-serve:5001...', 'Menunggu parsing...', etc. | |
| You decide | Let the agent decide. | |

### Q2: What key should we use for the extraction method in the return value when Docling succeeds?
| Option | Description | Selected |
|--------|-------------|----------|
| 'docling' | (Recommended) Add a new method option 'docling' to the type signature (method: 'pdfjs' | 'pdf-parse' | 'ocr' | 'docling'). | ✓ |
| Reuse 'pdfjs' | Reuse 'pdfjs': Do not change the type signature and treat Docling as a drop-in replacement for the digital path. | |
| You decide | Let the agent decide. | |

### Q3: When fallback occurs, should we log the transition details to the progress stream?
| Option | Description | Selected |
|--------|-------------|----------|
| Log transition | (Recommended) E.g., 'Metode Docling gagal/timeout. Beralih ke pembacaan digital alternatif...' so the user knows a fallback occurred. | ✓ |
| Silent transition | Silent transition: Do not notify the user about fallback, just silently post standard digital/OCR progress messages. | |
| You decide | Let the agent decide. | |

### Q4: How should we handle logging when docling-serve returns non-200 error codes like 422?
| Option | Description | Selected |
|--------|-------------|----------|
| Log full response body | (Recommended) Log the 422 JSON validation error details to server console to aid debugging payload errors, then trigger fallback. | ✓ |
| Log status code only | Log status code only: Log 'Docling API returned 422' without body detail. | |
| Treat like any network failure | Treat like any network failure: Throw a generic error and let the catch-all block trigger fallback. | |
| You decide | Let the agent decide. | |

---

## the agent's Discretion

All implementation options were explicitly chosen based on the recommended defaults selected during the discussion.

## Deferred Ideas

None — discussion stayed within phase scope.
