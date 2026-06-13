# PUU Tracker API Specification

This document provides a comprehensive reference for the API endpoints exposed by the **PUU Tracker** application.

---

## 1. Authentication & Security

All API endpoints (except public NextAuth routes) are protected by session authentication.
* **Mechanism**: NextAuth.js credentials provider using HTTP session cookies.
* **Role Guards**: Certain endpoints require the `ADMIN` role. If a `VIEWER` attempts to access them, the API will return a `403 Forbidden` response.
* **Middleware**: Global routing rules are defined in `src/middleware.ts` to redirect unauthenticated users to `/login`.

---

## 2. API Endpoints

### POST `/api/upload`
Initiates a streamed processing pipeline for uploading, text-extracting, parsing, and storing legislation PDFs.

* **Authorization**: Requires authenticated user with `ADMIN` role.
* **Rate Limiting**: Limited to 10 requests per minute per IP address. Returns `429 Too Many Requests` on violation.
* **Max Payload Size**: Up to 20MB. Returns `413 Payload Too Large` on violation.
* **Headers**:
  * `Content-Type: multipart/form-data`
* **Multipart Parameters**:
  * `file`: Binary file stream (PDF format only).
  * `regulationType`: Enumerated string value (e.g. `UU`, `PP`, `Perpres`, `Permen`, `Perda`).
  * `number`: The number of the legislation (e.g. `82`).
  * `year`: The publication year (e.g. `2018`).
  * `title` *(Optional)*: Customized title. If omitted, the system generates: `<regulationType> Nomor <number> Tahun <year>`.
  * `existingRegulationId` *(Optional)*: ID of the regulation if uploading a new version of an existing legislation topic.

#### Stream Response (Server-Sent Events)
The endpoint returns a `text/event-stream` stream. Each event is a JSON object followed by a newline:

* **Progress Event**:
  ```json
  { "type": "progress", "message": "Mencoba membaca teks digital..." }
  ```
* **Success Event**:
  ```json
  {
    "type": "success",
    "data": {
      "success": true,
      "message": "Perpres Nomor 82 Tahun 2018 tentang Jaminan Kesehatan berhasil diupload",
      "regulationId": "cuid-regulation-123",
      "versionId": "cuid-version-456",
      "parsedArticles": 12,
      "textLength": 56214
    }
  }
  ```
* **Error Event**:
  ```json
  { "type": "error", "message": "File terlalu besar (25MB). Maksimum 20MB." }
  ```

#### HTTP Status Codes
* `200 OK`: Successful connection initialization (client reads stream).
* `400 Bad Request`: Missing file, failed Zod validation, or duplicate version detected.
* `401 Unauthorized`: No active session cookie.
* `403 Forbidden`: User has `VIEWER` role instead of `ADMIN`.
* `413 Payload Too Large`: Upload payload exceeds limits.
* `429 Too Many Requests`: Rate limit exceeded.

---

### GET `/api/documents/[...path]`
Serves as a secure download proxy for PDFs stored inside the MinIO object storage.

* **Authorization**: Requires authenticated user (`ADMIN` or `VIEWER`).
* **Parameters**:
  * `path`: URL parameter representing the path to the PDF inside the S3 bucket (e.g. `/api/documents/regulations/2018/Perpres_82_17178392.pdf`).
* **Response**:
  * Headers: `Content-Type: application/pdf`
  * Body: PDF binary stream.
* **HTTP Status Codes**:
  * `200 OK`: File streaming success.
  * `401 Unauthorized`: User not logged in.
  * `404 Not Found`: File does not exist in the MinIO bucket.
  * `500 Internal Server Error`: Connection error with MinIO.

---

## 3. Zod Input Validation Schema

Data boundaries are validated using Zod schema models defined in `src/lib/validations.ts`:

```typescript
import { z } from 'zod';

export const uploadSchema = z.object({
  regulationType: z.enum(['UU', 'PP', 'Perpres', 'Permen', 'Perda'], {
    errorMap: () => ({ message: 'Tipe peraturan harus dipilih' }),
  }),
  number: z.string().min(1, 'Nomor peraturan harus diisi'),
  year: z.coerce.number().int().min(1945).max(new Date().getFullYear()),
  title: z.string().optional(),
  existingRegulationId: z.string().optional(),
});
```
*Note: The upload endpoint parses the year and other parameters using safeParse. Invalidation results in immediate HTTP 400 response before files are processed.*
