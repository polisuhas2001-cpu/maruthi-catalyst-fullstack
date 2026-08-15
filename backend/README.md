# Maruthi Catalyst — Backend

Node.js + TypeScript + Express API backing the Maruthi Catalyst frontend.

## Stack

- **Runtime:** Node.js + TypeScript (ESM, NodeNext)
- **Framework:** Express
- **Database:** PostgreSQL (Supabase recommended)
- **Email:** Resend
- **Auth:** JWT stored in an httpOnly, secure, sameSite cookie (not localStorage)

## Local setup

```bash
cd backend
cp .env.example .env      # then fill in the real values — see root README
npm install
npm run migrate           # applies db/schema.sql to DATABASE_URL
npm run create-admin      # interactive prompt to create your first admin login
npm run dev                # starts the API on http://localhost:4000
```

## API reference

All responses are JSON. Errors follow `{ "success": false, "message": "...", "fieldErrors"?: {...} }`.

### `GET /api/health`
No auth. Returns `{ "status": "ok" }`.

### `POST /api/submissions`
No auth. Rate limited (5 requests / 15 min / IP).

Request body:
```json
{
  "fullName": "string, 2-120 chars",
  "email": "string, valid email",
  "contact": "string, 6-30 chars",
  "industry": "string, 2-80 chars",
  "title": "string, 3-160 chars",
  "description": "string, 20-5000 chars",
  "resources": "string, 2-2000 chars"
}
```

Success (201):
```json
{ "success": true, "message": "Your startup idea has been submitted successfully.", "submissionId": "MC-2026-00001" }
```

Errors: `422` with `fieldErrors` for validation failures, `429` if rate limited, `500` for unexpected server errors (message is always safe to display).

### `POST /api/auth/login`
No auth required (this *is* the login). Rate limited (10 attempts / 15 min / IP).

Body: `{ "email": "...", "password": "..." }`. On success, sets the session cookie and returns `{ "success": true, "email": "..." }`. Returns `401` with a generic "Invalid email or password" message on any failure (doesn't reveal whether the email exists).

### `POST /api/auth/logout`
Clears the session cookie. Returns `{ "success": true }`.

### `GET /api/auth/me`
Requires a valid session cookie. Returns `{ "email": "..." }` or `401`.

### `GET /api/admin/submissions?search=&status=`
Requires admin session. Returns `{ "submissions": [...], "total": number }`. `search` matches name/email/title/submission ID; `status` filters exactly.

### `GET /api/admin/submissions/:id`
Requires admin session. Returns `{ "submission": {...} }` or `404`.

### `PATCH /api/admin/submissions/:id`
Requires admin session. Body: `{ "status"?: "NEW"|"UNDER_REVIEW"|"SHORTLISTED"|"ACCEPTED"|"REJECTED"|"CONTACTED", "adminNotes"?: "string" }`. Returns the updated `{ "submission": {...} }`.

## Creating additional admins

Re-run `npm run create-admin` any time — it upserts by email, so it also works to reset a forgotten password.

## Security notes

- Passwords are hashed with bcrypt (12 rounds), never stored or logged in plaintext.
- Sessions are JWTs (12h expiry) in an httpOnly cookie — not readable by frontend JS, so they can't be stolen via XSS.
- `helmet` sets standard security headers; CORS is locked to `CORS_ORIGIN` origins only.
- Request bodies are capped at 100kb.
- The submission endpoint has a honeypot field (`website`) — real browsers never fill it; bots often do. Tripped submissions get a fake success response and are never stored or emailed.
- All admin routes require `requireAdmin` middleware; there is no client-side-only protection.
- Errors are logged server-side with full detail; only safe, generic messages ever reach the browser.
