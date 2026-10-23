# Node.js / pg-boss process and FastAPI API audit contract

This contract accompanies the Humaniti React UI. React communicates with Node only. Node owns PostgreSQL, pg-boss, upload storage, and the internal FastAPI token.

## Required lifecycle

1. Node receives an upload and validates it.
2. Node stores the file in configured object storage, creates the evaluation with `pending` status, and creates a process record with `queued` status.
3. pg-boss worker marks the process `processing`, records an attempt, and calls FastAPI with `{ "s3_key": "...", "evaluation_id": "..." }` plus the internal token header.
4. Before the call, persist the sanitized request payload and request metadata. When the call returns, persist HTTP status, sanitized response payload and elapsed time. If it throws or times out, persist error metadata and indicate that no valid response was received.
5. Update the evaluation and process status. A failed retry must create another attempt entry; do not overwrite the prior attempt.
6. Expose sanitized process log data through Node endpoints for the React Process Monitor.

## Recommended data model

Use the existing `process` table for current lifecycle state and a child table such as `process_api_logs` for each FastAPI request attempt. Keep SQL schema and manual update scripts in the Node repository only.

Recommended columns for `process_api_logs`:

- `process_api_log_id` — primary key
- `process_id` — foreign key to the process record
- `evaluation_id` — evaluation identifier
- `attempt_number` — monotonically increasing per process
- `stage` — e.g. `full-analysis`, `transcription-test`, `audio-quality-test`
- `request_method` — normally `POST`
- `request_url` — internal FastAPI URL, without credentials or query secrets
- `request_headers_redacted` — JSONB allowlist of safe headers only
- `request_body_json` — JSONB request body after secret redaction
- `response_status` — nullable HTTP status
- `response_body_json` — nullable JSONB response body or bounded summary
- `error_name` — nullable exception class/name
- `error_message` — nullable sanitized error message
- `started_at`, `completed_at` — timestamps
- `duration_ms` — elapsed milliseconds
- `created_at` — timestamp

The current process record should additionally expose status (`queued`, `processing`, `processed`, `failed`), current stage, created/updated/completed timestamps, and a concise last error. If the existing `process` schema differs, use the existing conventions and a manual numbered update script; do not add automatic schema/migration execution at startup.

## Security and retention

- Never store the value of `x-internal-token`, provider API keys, authorization headers, AWS credentials, cookies, or signed S3 query parameters.
- Redact secrets before writing to the database, not just when rendering the UI.
- Enforce role-based access to payloads and error details.
- Keep list endpoints lightweight. Include bounded log summaries in process lists; fetch full permitted details by process ID.
- Cap large response bodies. Store a summary and a storage reference if the response is too large.
- Apply a retention policy to raw request/response bodies.
- Do not include recording bytes or full transcripts in logs unless there is a defined, privacy-reviewed need.

## Suggested Node API contract

### `GET /api/v1/processes?include_logs=true`

Returns an array of process summaries. Each item can include:

```json
{
  "process_id": "pr-2081",
  "evaluation_id": "ev-1048",
  "name": "Class recording analysis",
  "status": "processed",
  "stage": "Completed",
  "created_at": "2026-10-21T10:42:01Z",
  "duration": "2m 18s",
  "request": { "evaluation_id": "ev-1048", "s3_key": "recordings/redacted-object-key.mp4" },
  "response": { "status": "completed" },
  "logs": [
    { "time": "10:42:01", "type": "info", "message": "Worker picked up queued process." },
    { "time": "10:42:02", "type": "request", "message": "POST /api/v1/analyze — request sent to FastAPI." },
    { "time": "10:44:19", "type": "response", "message": "FastAPI returned HTTP 200." }
  ]
}
```

This is an illustrative response shape. Production data must be generated from actual process records and actual audit rows, not hardcoded demo values.

### `GET /api/v1/processes/:processId?include_logs=true`

Returns one process plus ordered attempts and permitted request/response JSON. Include HTTP status and duration for each attempt. Return a sanitized representation only.

### `POST /api/v1/processes/:processId/retry`

Validate that retry is permitted, enqueue through pg-boss, and return the updated process state. Preserve previous attempt logs.

### Testing endpoints

The React testing page expects Node endpoints for transcription, teaching-effectiveness, audio-quality, and video/screen tests. Node should proxy each request to the corresponding FastAPI test endpoint and log the request/response with the same redaction, attempt and timing rules as full analysis.

## Frontend mapping

The React UI expects process status values `queued`, `processing`, `processed` or `failed`. The evaluation UI expects `pending`, `processing`, `completed` or `failed`. Normalize the underlying database values in the Node model/API layer rather than exposing inconsistent database naming to the browser.
