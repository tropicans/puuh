# PUU Tracker System Architecture

This document describes the technical architecture and data flow of the **PUU Tracker** application, focusing on its core mechanisms: the text extraction pipeline and the verbatim comparison (diff) engine.

---

## 1. System Components & High-Level Design

PUU Tracker is designed around a decoupled, service-oriented architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                          Web Interface                          │
│                   Next.js Pages & Components                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Server Actions
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Service Layer                          │
│     pdf-service.ts     ocr-service.ts     ai-service.ts         │
└───────┬────────────────────────┬────────────────────────┬───────┘
        │                        │                        │
        ▼ S3 API                 ▼ OpenAI API             ▼ Prisma
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ MinIO Storage │        │   LLM Proxy   │        │  PostgreSQL   │
│ (Raw PDFs)    │        │ (Vision/Chat) │        │ (Metadata/DB) │
└───────────────┘        └───────────────┘        └───────────────┘
```

* **Client Component Views**: Interactive, responsive dashboards and compare blocks using Framer Motion and Lucide icons.
* **Server Actions**: Directly perform operations (e.g. creating regulation records, running comparisons) and talk to database/storage.
* **Service Libraries**: Handle low-level integration (OCR, PDF splitting, LCS diff calculation).

---

## 2. Text Extraction & Fallback Pipeline

Legislation PDFs can be digitally generated (selectable text) or scanned images. The system implements a robust, multi-stage pipeline in `src/lib/pdf-service.ts` and `src/lib/ocr-service.ts` to ensure text is extracted under all circumstances.

```mermaid
flowchart TD
    Start([Upload PDF Buffer]) --> PDFJS[extractTextFromPdf via pdfjs-dist]
    PDFJS --> CheckText{Text length > 200\n& not scanned?}
    
    CheckText -- Yes --> ReturnPDFJS([Return Digital Text])
    
    CheckText -- No/Error --> ParseFallback[Try pdf-parse library]
    ParseFallback --> CheckParse{Text length > 200?}
    
    CheckParse -- Yes --> ReturnParse([Return Text])
    
    CheckParse -- No/Error --> SplitPDF[Split PDF into 5-page chunks]
    SplitPDF --> OCRDirect{Is file < 1MB?}
    
    OCRDirect -- Yes --> TryDirect[Direct Vision OCR via Gemini]
    TryDirect -- Success --> ReturnOCRDirect([Return OCR Text])
    
    OCRDirect -- No/Failure --> ConcurrencyPool[Run Chunk OCR concurrently\nconcurrency limit = 3]
    ConcurrencyPool --> ChunkSuccess{Chunk passes?}
    
    ChunkSuccess -- Yes --> ReturnOCRChunks([Return Merged OCR Text])
    
    ChunkSuccess -- No/Failure --> PageOCR[Fallback: single-page OCR\nfor failed chunk]
    PageOCR --> ReturnPageOCR([Return Merged Text])
```

### Fallback Details
1. **pdfjs-dist**: Attempts to parse character tokens and maps coordinates. If total characters extracted are `< 100 * totalPages`, it flags the PDF as scanned.
2. **pdf-parse**: Serves as a fallback for old digital PDFs that cause coordinate exceptions in PDF.js.
3. **Smart PDF Chunking**: Large PDFs exceed API payload constraints (usually 4MB or 15MB). The system uses `pdf-lib` to extract and compile 5-page PDF sub-documents.
4. **Resilient Vision OCR**: Chunks are processed via `/chat/completions` using the `gemini-2.5-flash` model. If a chunk fails, the service falls back to extracting pages one by one for that chunk.
5. **Concurrent Pool (`runWithConcurrencyLimit`)**: Runs tasks with a configurable concurrency limit (default: 3) to prevent HTTP 429 (Rate Limit) errors from the LLM endpoint.

---

## 2.2. Automatic Regulation Fetching Pipeline

To simplify data ingestion, the system includes an automatic fetching service (`src/lib/regulation-fetcher.ts`) that implements a 4-strategy pipeline to query, download, and extract text from public sources. This runs entirely in the background and reports progress in real time via Server-Sent Events (SSE).

```mermaid
flowchart TD
    Start([Receive Fetch Request]) --> InputCheck{Has raw query?}
    
    InputCheck -- Yes --> ParseInput[Parse query via LLM\ne.g., 'Perpres 82 2018']
    ParseInput --> SetParams[Extract Type, Number, Year]
    InputCheck -- No --> SetParams
    
    SetParams --> Strategy1[Strategy 1: JDIH BPK Search Scraping]
    Strategy1 --> S1Check{PDF found & downloaded?}
    
    S1Check -- Yes --> ExtractText[Extract PDF Text\nSmart Extraction]
    S1Check -- No --> Strategy2[Strategy 2: Direct URL Patterns\nSetneg / peraturan.go.id]
    
    Strategy2 --> S2Check{PDF found & downloaded?}
    S2Check -- Yes --> ExtractText
    S2Check -- No --> Strategy3[Strategy 3: LLM-Assisted URL Search]
    
    Strategy3 --> S3Check{PDF found & downloaded?}
    S3Check -- Yes --> ExtractText
    S3Check -- No --> Strategy4[Strategy 4: Pasal.id Fallback\nPersonal Token API]
    
    Strategy4 --> S4Check{PDF found & downloaded?}
    S4Check -- Yes --> ExtractText
    S4Check -- No --> Fail([Return Error Event])
    
    ExtractText --> TextCheck{Text extraction success?}
    TextCheck -- Yes --> SaveDB[Save Version & Parse Articles]
    TextCheck -- No --> Fail
    
    SaveDB --> Success([Return Success Event])
```

### Detailed Strategy Fallback Loop

1. **Strategy 1: BPK Search Scraping (`searchBPK`)**: Performs a query directly on `peraturan.bpk.go.id/Search?nomor={number}&tahun={year}`. It parses the results for direct PDF download links and matching detail page paths (`/Details/{id}`). If no direct download link exists, it attempts to follow detail pages to scrape the PDF URLs. Matches are validated against the target regulation type, number, and year using string heuristics.
2. **Strategy 2: Direct URL Patterns (`generatePossibleUrls`)**: Constructs candidate URLs based on known patterns for `jdih.setneg.go.id` and `peraturan.go.id` for major types (`UU`, `PP`, `Perpres`).
3. **Strategy 3: LLM Search (`searchWithAI`)**: Queries the LLM proxy to suggest an exact URL structure for the target regulation from trusted domains.
4. **Strategy 4: Pasal.id API Fallback (`fetchFromPasalId`)**: Serves as the ultimate fallback. Uses the `PASAL_ID_TOKEN` to call Pasal.id's search API (`/api/v1/search`), filters the results for exact metadata matches, retrieves the unique `frbr_uri`, requests the specific legislation JSON details, and extracts the `source_pdf_url` (or `provenance.source_pdf_url`).
5. **JDIH Setkab Removal**: All legacy connection attempts to JDIH Setkab (which were unstable and rate-limited) have been removed, making the fetcher lean and reliant on the BPK crawler as primary and Pasal.id as the robust secondary.

---

## 3. Verbatim LCS Diff Engine

The diff engine (`src/lib/diff-engine.ts`) implements a word-level (verbatim) Longest Common Subsequence (LCS) algorithm to track legislative modifications.

### Step 1: Tokenization (`tokenize`)
Instead of lines or characters, text is tokenized into words and whitespace/punctuation.
```typescript
// Example: "Pasal 1: Negara Indonesia..."
// Tokens: ["Pasal", " ", "1", ":", " ", "Negara", " ", "Indonesia"]
```
This preserves whitespaces and punctuation so that formatting differences are displayed accurately without breaking word alignments.

### Step 2: LCS Matrix Calculation (`longestCommonSubsequence`)
Calculates the longest common subsequence of tokens between the old token array ($A$) and new token array ($B$) using Dynamic Programming (DP) with space optimization:
$$\text{dp}[i][j] = \begin{cases} 
\text{dp}[i-1][j-1] + 1 & \text{if } A[i-1] == B[j-1] \\ 
\max(\text{dp}[i-1][j], \text{dp}[i][j-1]) & \text{otherwise} 
\end{cases}$$

### Step 3: Backtracking & Diff Generation (`compareTexts`)
Backtracks through the DP table from $(m, n)$ to $(0, 0)$ to reconstruct the LCS sequence. During this traversal:
* Tokens present in both arrays are marked as `equal`.
* Tokens present only in the old array are marked as `delete`.
* Tokens present only in the new array are marked as `insert`.

### Step 4: Adjacency Merging (`mergeParts`)
Adjacent diff segments with the same type are merged to reduce DOM rendering load:
```
[Delete: "Pasal"], [Delete: " "], [Delete: "1"] 
                 ▼ Merged
[Delete: "Pasal 1"]
```

---

## 4. LLM-Assisted Article Parser

Once text is extracted, the raw text is unstructured. `src/lib/ai-service.ts` converts the text into a structured JSON database schema.
1. **LLM Prompting**: It uses the LLM proxy to extract articles and map them into a JSON list containing:
   * `articleNumber` (e.g. *Pasal 1*, *Pasal 2 ayat (1)*)
   * `content` (verbatim text)
2. **Regex Fallback**: If the LLM output is malformed (fails to parse as JSON), the system falls back to a regex-based parser. The regex scans for word patterns like `^Pasal \d+` or `^BAB [IVXLCDM]+` to partition the text, ensuring that the upload pipeline is never blocked.
