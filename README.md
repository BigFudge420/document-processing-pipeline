<div align="center">

# DOCUMENT-OCR-PROCESSING-API

*Async Job API for Text Extraction from Images*

![Last Commit](https://img.shields.io/github/last-commit/BigFudge420/document-ocr-processing-api?label=last%20commit&color=blue)
![TypeScript](https://img.shields.io/badge/typescript-100.0%25-blue)
![License](https://img.shields.io/badge/license-ISC-green)

**Built with the tools and technologies:**

![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![.ENV](https://img.shields.io/badge/.ENV-ECD53F?style=flat&logo=dotenv&logoColor=black)

</div>

---

## 📋 Table of Contents

- [Overview](#overview-)
- [Features](#features-)
- [How It Works](#how-it-works-)
- [Tech Stack](#tech-stack-)
- [Architecture](#architecture-)
- [Environment Variables](#environment-variables-)
- [Build & Run Instructions](#build--run-instructions-)
  - [Prerequisites](#prerequisites-)
  - [1. Clone the repository](#1-clone-the-repository-)
  - [2. Installing dependencies](#2-installing-dependencies-)
  - [3. Configure environment variables](#3-configure-environment-variables-)
  - [4. Run database migrations](#4-run-database-migrations-)
  - [5. Run in development mode](#5-run-in-development-mode-)
  - [6. Build for production](#6-build-for-production-)
  - [7. Run the production build](#7-run-the-production-build-)
- [API Documentation](#api-documentation-)
  - [Upload Document](#upload-document)
  - [Check Job Status](#check-job-status)
- [Testing the Service](#testing-the-service-)
- [Job Status Flow](#job-status-flow-)
- [Error Handling](#error-handling-)
- [Worker Process](#worker-process-)

---

## Overview 📋

An async job processing API that accepts document uploads (images), extracts text using Tesseract.js OCR, and exposes a polling endpoint for results. Clients receive an immediate response with a job ID, then poll for completion rather than waiting 10-30 seconds for OCR to finish.

This service demonstrates the **async request-reply pattern** (HTTP 202 Accepted) and is designed for **reliability and correctness** in handling long-running operations.

---

## Features ✨

- **Async Job Processing** 🔄 - Returns 202 Accepted immediately, processes OCR in background
- **Real OCR Integration** 🔍 - Uses Tesseract.js with multi-worker concurrency
- **File Upload Handling** 📁 - Accepts images up to 10MB with validation
- **Automatic Retry Logic** 🔁 - Retries failed jobs up to 3 times
- **Job Status Tracking** 📊 - Poll endpoint returns current job state
- **Timeout Recovery** ⏱️ - Detects and retries stuck jobs after 5 minutes
- **Graceful Shutdown** 🛑 - Clean worker termination on SIGTERM/SIGINT
- **File Cleanup** 🗑️ - Automatic cleanup of uploaded files after processing

---

## How It Works 🔧

1. **Client Uploads Document** - POST request with image file
2. **Immediate Response** - Server returns 202 Accepted with `job_id`
3. **Background Processing** - Worker process extracts text via OCR
4. **Status Updates** - Job transitions: `pending` → `processing` → `completed` / `failed`
5. **Client Polls** - GET request with `job_id` to check status
6. **Results Retrieved** - When completed, response includes extracted text

```
Client Upload → 202 + job_id → Worker OCR → Status: completed → Client retrieves text
                                      ↘ Status: failed → Error message
```

---

## Tech Stack 🛠️

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Job state persistence
- **Prisma** - Database ORM
- **Tesseract.js** - OCR engine
- **Multer** - File upload handling
- **Zod** - Runtime validation
- **dotenv** - Environment configuration
- **tsx** - TypeScript execution for development

---

## Architecture 🗂️

### Core Components

- **`app.ts`** - Express application setup and route configuration
- **`uploadController.ts`** - File upload handling and job creation
- **`statusController.ts`** - Job status retrieval endpoint
- **`fileFilter.ts`** - File type validation (mimetype + extension)
- **`worker.ts`** - Background OCR processing with Tesseract.js
- **`server.ts`** - HTTP server and worker process management
- **`prisma.main.ts`** - Database client instance
- **`config.ts`** - Configuration loading and validation

### Request Flow

```
POST /documents → uploadController → Create Job (status: pending) → Return 202 + job_id
                                                ↓
                                          Worker polls DB
                                                ↓
                                    Claim job (status: processing)
                                                ↓
                                        Run Tesseract OCR
                                                ↓
                            Update job (status: completed/failed)
                                                ↓
                                          Clean up file

GET /documents/:id → statusController → Query job by ID → Return status + text (if completed)
```

---

## Environment Variables 🌍

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
```

### Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ Yes |
| `PORT` | Server port | `3000` | ❌ No |

---

## Build & Run Instructions 🏗️

### Prerequisites ✔️

- Node.js **18+**
- PostgreSQL **14+**
- npm

---

### 1. Clone the repository 📦

```bash
git clone https://github.com/BigFudge420/document-ocr-processing-api.git
cd document-ocr-processing-api
```

### 2. Installing dependencies ⬇️

```bash
npm install
```

### 3. Configure environment variables ⚙️

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ocr_db
PORT=3000
```

### 4. Run database migrations 🗄️

```bash
npx prisma migrate dev
```

This creates the required `DocumentJob` table with indexes.

### 5. Run in development mode 🔥

**Terminal 1 - API Server:**
```bash
npm run dev
```

**Terminal 2 - Worker Process:**
```bash
tsx worker.ts
```

- Uses `tsx` with watch mode
- Auto-restarts on file changes
- Intended for local development only

**Note:** The server automatically forks the worker process, but for development it's recommended to run them separately for better visibility.

### 6. Build for production 📦

```bash
npm run build
```

This compiles TypeScript into the `dist/` directory.

### 7. Run the production build 🚀

```bash
npm start
```

This runs the compiled JavaScript from `dist/server.js` and automatically starts the worker process.

---

## API Documentation 📚

### Upload Document

**Endpoint:** `POST /documents`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
```
document: <file> (image file, max 10MB)
```

**Supported Formats:**
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`, `.jpe`)
- WEBP (`.webp`)
- GIF (`.gif`)
- TIFF (`.tif`, `.tiff`)
- BMP (`.bmp`)
- PNM (`.pbm`, `.pgm`, `.ppm`, `.pnm`)

**Success Response:**
```
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `400` | No file provided | `{"error": "Document not provided"}` |
| `400` | Unexpected field name | `{"error": "Unexpected field"}` |
| `413` | File too large (>10MB) | `{"error": "Content too large"}` |
| `415` | Unsupported file type | `{"error": "Unsupported media type"}` |
| `500` | Server error | `{"error": "Internal server error"}` |

**Example:**
```bash
curl -X POST http://localhost:3000/documents \
  -F "document=@receipt.jpg"
```

---

### Check Job Status

**Endpoint:** `GET /documents/:id`

**Parameters:**
- `id` - Job ID returned from upload

**Success Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "text": "Invoice\nDate: 2025-01-15\nTotal: $100.00\n..."
  }
}
```

**Status Values:**
- `pending` - Job created, waiting for worker
- `processing` - OCR in progress
- `completed` - Text extraction successful
- `failed` - OCR failed (see logs for details)

**Error Responses:**

| Status | Condition | Response Body |
|--------|-----------|---------------|
| `400` | Invalid job ID format | `{"error": "Bad request"}` |
| `404` | Job not found | `{"error": "Job not found"}` |
| `500` | Server error | `{"error": "Internal server error"}` |

**Example:**
```bash
curl http://localhost:3000/documents/550e8400-e29b-41d4-a716-446655440000
```

---

## Testing the Service 🧪

### Test 1: Upload and Poll

**1. Upload an image:**
```bash
curl -X POST http://localhost:3000/documents \
  -F "document=@test-image.jpg"
```

**Expected response:**
```json
{"jobId": "550e8400-e29b-41d4-a716-446655440000"}
```

**2. Immediately check status:**
```bash
curl http://localhost:3000/documents/550e8400-e29b-41d4-a716-446655440000
```

**Expected response:**
```json
{
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  }
}
```

**3. Wait 10-15 seconds, check again:**
```bash
curl http://localhost:3000/documents/550e8400-e29b-41d4-a716-446655440000
```

**Expected response:**
```json
{
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "text": "Extracted text from the image..."
  }
}
```

---

### Test 2: Invalid File Type

```bash
curl -X POST http://localhost:3000/documents \
  -F "document=@document.pdf"
```

**Expected response:**
```
HTTP/1.1 415 Unsupported Media Type

{"error": "Unsupported media type"}
```

---

### Test 3: File Too Large

```bash
# Create a 15MB file
dd if=/dev/zero of=large.jpg bs=1M count=15

curl -X POST http://localhost:3000/documents \
  -F "document=@large.jpg"
```

**Expected response:**
```
HTTP/1.1 413 Content Too Large

{"error": "Content too large"}
```

---

### Test 4: Missing File

```bash
curl -X POST http://localhost:3000/documents
```

**Expected response:**
```
HTTP/1.1 400 Bad Request

{"error": "Document not provided"}
```

---

### Test 5: Job Not Found

```bash
curl http://localhost:3000/documents/invalid-uuid
```

**Expected response:**
```
HTTP/1.1 404 Not Found

{"error": "Job not found"}
```

---

## Job Status Flow 📊

```
┌─────────┐
│ pending │ ← Job created
└────┬────┘
     │ Worker claims job
     ↓
┌────────────┐
│ processing │ ← OCR in progress
└─────┬──────┘
      │
      ├─────────→ Success
      │            ↓
      │       ┌───────────┐
      │       │ completed │ ← Text extracted
      │       └───────────┘
      │
      └─────────→ Failure
                   ↓
              ┌────────┐
              │ failed │ ← Error occurred
              └────────┘
                   │
                   │ Retry (if attempts < 3)
                   ↓
              Back to pending
```

---

## Error Handling ⚠️

### Upload Errors

- **File too large:** Returns 413, file not saved
- **Invalid file type:** Returns 415, file not saved
- **Database error:** Returns 500, uploaded file cleaned up automatically

### Processing Errors

- **OCR failure:** Job marked as `failed`, error message stored
- **File not found:** Job marked as `failed`
- **Worker crash:** Job marked as `failed` after 5-minute timeout
- **Retry logic:** Failed jobs automatically retry up to 3 times

### Worker Recovery

- **Stuck jobs:** Jobs in `processing` state for >5 minutes are automatically reclaimed
- **Worker crash:** Server detects worker exit and restarts after 60 seconds
- **Graceful shutdown:** Worker completes current jobs before exiting on SIGTERM

---

## Worker Process 👷

### Concurrency

The worker uses **3 concurrent Tesseract.js workers** via a scheduler, allowing parallel OCR processing.

### Job Claiming

Uses **optimistic locking** with `updateMany`:
```sql
UPDATE jobs 
SET status = 'processing', attempts = attempts + 1
WHERE id = ? 
  AND status IN ('pending', 'failed')
  AND attempts < 3
```

Only one worker successfully claims each job, preventing duplicate processing.

### Polling Strategy

- **Poll interval:** 30 seconds when no jobs available
- **Batch size:** Up to 3 jobs per poll (matches concurrency)
- **Immediate processing:** Claims and processes jobs as soon as they're found

### Retry Logic

- **Max attempts:** 3
- **Retry conditions:** Failed jobs with `attempts < 3`
- **Timeout recovery:** Jobs stuck in `processing` for >5 minutes

### Graceful Shutdown

On SIGTERM or SIGINT:
1. Stop accepting new jobs
2. Terminate Tesseract scheduler
3. Disconnect from database
4. Exit with code 0

---

## Configuration Details 🔧

### File Upload Limits

- **Max file size:** 10MB (configurable in `uploadController.ts`)
- **Upload directory:** `temp/` (relative to project root)
- **File cleanup:** Automatic after processing (success or failure)

### Database Schema

```prisma
model DocumentJob {
  id            String    @id @default(uuid())
  status        String    // 'pending' | 'processing' | 'completed' | 'failed'
  filePath      String    // Path to uploaded file
  extractedText String?   // OCR result (null until completed)
  error         String?   // Error message (if failed)
  attempts      Int       @default(0)
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  
  @@index([status, attempts, startedAt])
}
```

### Key Indexes

- `(status, attempts, startedAt)` - Optimizes worker polling queries
- Supports efficient claiming of pending/failed jobs with timeout detection

---

## Best Practices 💡

1. **Poll responsibly** - Wait 5-10 seconds between status checks
2. **Handle 202 correctly** - Don't expect immediate results
3. **Check for failures** - Monitor `status: "failed"` and handle appropriately
4. **Retry on 5xx errors** - Transient server errors may recover
5. **Clean up files** - Service automatically cleans up, but clients shouldn't rely on file persistence

---

## Limitations 🚧

- **Single instance** - No distributed worker coordination
- **No job expiration** - Completed jobs remain in database indefinitely
- **No progress tracking** - Binary status (pending/processing/completed/failed)
- **Image formats only** - PDF support not implemented
- **No authentication** - Internal service assumption

---

## Future Enhancements 🔮

- [ ] Webhook callbacks on job completion
- [ ] Job expiration and cleanup (auto-delete after 24 hours)
- [ ] Progress tracking for multi-page documents
- [ ] PDF support with page-by-page extraction
- [ ] Pagination for listing all jobs
- [ ] Admin API for job management

---

## Troubleshooting 🔍

### Worker not processing jobs

**Check worker is running:**
```bash
ps aux | grep worker.ts
```

**Check worker logs:**
```bash
# Worker should print "Worker loop error" if database connection fails
```

**Verify database connection:**
```bash
npx prisma studio  # Opens database browser
```

### Jobs stuck in "processing"

Jobs stuck for >5 minutes are automatically recovered. If this persists:

1. Check worker logs for OCR errors
2. Verify Tesseract.js installation
3. Restart worker process

### High memory usage

Tesseract.js can use significant memory for large images. If memory is constrained:

1. Reduce `CONCURRENCY` in `worker.ts` (default: 3)
2. Add file size validation (reject images >5MB)
3. Increase worker restart delay

---

## License 📄

ISC

---

## Contributing 🤝

Issues and pull requests are welcome at the [GitHub repository](https://github.com/BigFudge420/document-ocr-processing-api).

---

<div align="center">

Made with ❤️ by [BigFudge](https://github.com/BigFudge420)

</div>