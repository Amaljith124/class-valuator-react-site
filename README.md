# Humaniti Classroom Intelligence — React UI

A responsive React + Vite dashboard for the Humaniti class-recording analysis workflow.

## Included pages

- **Overview** — pipeline snapshot, metrics, recent evaluations and quick actions.
- **Upload recording** — drag-and-drop audio/video selection, session metadata and queue submission.
- **Process monitor** — pg-boss process status, search/filter, process activity and FastAPI request/response JSON viewer.
- **Testing session** — independently run transcription, teaching effectiveness, audio quality, and video/shared-screen analysis.
- **Evaluations** — searchable/filterable evaluation library, score summaries and JSON export.
- **Evaluation report** — overall teaching score, separate audio/video quality scores, criteria, weights and evidence.

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
cp .env.example .env
npm run dev
```

The UI starts in **demo mode** by default so you can inspect the design without a backend. Demo mode uses clearly illustrative sample data. It does not run real analysis.

## Connect to the Node server

Set `.env` to:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_DEMO_MODE=false
```

The React app calls **Node only**. It must not call FastAPI directly or expose `x-internal-token`, OpenAI keys, Gemini keys, or AWS credentials to the browser.

The API client currently expects these Node endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/user/evaluations` | List evaluations |
| GET | `/user/evaluations/:evaluationId` | Evaluation report and criteria evidence |
| POST | `/user/evaluations/upload` | Accept multipart recording + title/teacher/subject/notes, store it, create pending evaluation and queued pg-boss process |
| GET | `/user/processes?include_logs=true` | List process records, status and log summaries |
| GET | `/user/processes/:processId?include_logs=true` | Process details, sanitized FastAPI request/response, timings and events |
| POST | `/user/processes/:processId/retry` | Requeue a failed process |
| POST | `/user/testing/transcription` | Run transcription test |
| POST | `/user/testing/teaching-effectiveness` | Run teaching-effectiveness test |
| POST | `/user/testing/audio-quality` | Run audio-quality test |
| POST | `/user/testing/video-screen` | Run video/shared-screen test |

These user routes are mounted by the Node `/api/v1/user` index router. The agent API is mounted separately by `/api/v1/agent`.

## Important process-log requirement for Node/pg-boss

Persist the FastAPI call as part of the Node process log. Recommended fields:

- `process_id`, `evaluation_id`, `attempt_number`, `stage`
- `request_method`, `request_url` (internal URL only), `request_headers_redacted`, `request_body_json`
- `response_status`, `response_body_json`, `error_name`, `error_message`
- `started_at`, `completed_at`, `duration_ms`, `created_at`

Store request and response bodies as JSONB where practical. For large responses, store a bounded/redacted summary plus an object-storage reference. Do not persist secrets, authorization headers, API keys, signed S3 URLs, or unnecessary personal data. Apply access control to process logs and consider retention limits. Never log the `x-internal-token` value.

The process log should record the exact sanitized request sent to FastAPI and the response or exception received. On timeout, record the request, elapsed time, timeout details and that no valid response body was received. On retries, create a new attempt entry rather than overwriting the previous attempt.

## Integration notes

- Upload route should use multipart/form-data and return `{ evaluation_id, process_id, status }`.
- The browser should receive a normal Node API response; Node owns storage, SQL, pg-boss and the FastAPI internal token.
- Process list/detail responses should return `request` and `response` fields only after server-side secret redaction.
- Testing routes should proxy to FastAPI from Node and log the request/response in the same manner as full analysis.
- Evaluation response fields used by the report include `evaluation_id`, `title`, `teacher`, `subject`, `date`, `duration`, `status`, `overall_score`, `teaching_score`, `audio_score`, `video_score`, `coverage`, `summary`, and `criteria[]` with `name`, `score`, `weight`, `evidence`.
- The overall teaching score is expected to be computed server-side using assessable criteria and renormalized weights; audio/video quality remain separate dimensions.

## Suggested production hardening

1. Add authentication and authorization in Node for all UI routes.
2. Enforce upload size/type limits server-side; the browser limit is only a convenience.
3. Add pagination to evaluations/processes and avoid returning large request/response bodies in list endpoints.
4. Add polling or Server-Sent Events/WebSockets for live process updates.
5. Add accessibility and cross-browser tests, error boundaries, request cancellation, and integration tests.
6. Configure CORS on Node for the frontend origin only.
