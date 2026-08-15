# Maruthi Catalyst — Venture Portal

Existing React frontend + a new production backend, database, email notifications, and admin dashboard.

```
maruthi-catalyst/
├── frontend/     — React + TypeScript + Vite (existing site, preserved)
└── backend/      — Node.js + TypeScript + Express API
```

---

## A. Architecture

```
Browser
  │
  ▼
Frontend (React + Vite, static build)
  │  fetch, credentials: 'include'
  ▼
Backend API (Express, Node.js)
  │                              │
  ▼                              ▼
PostgreSQL (Supabase)      Resend (email)
  - startup_submissions      - admin notification
  - admin_users              - founder confirmation
  - submission_counters
```

- **Frontend:** unchanged in design/branding/animations. The idea-submission form now calls the real API instead of only updating local state; two new routes (`/admin/login`, `/admin`) were added for the dashboard, styled with the site's existing color tokens but without the marketing chrome (no nav, hero, animations).
- **Backend:** Express + TypeScript, organized into `routes → controllers → services`, with Zod validation and centralized error handling.
- **Database:** PostgreSQL is the source of truth for every submission. Email is a notification layer on top of it, never a replacement for it — a failed email never causes a lost or duplicated submission.
- **Auth:** Admin sessions are JWTs in an httpOnly, secure, sameSite cookie. No admin credentials ever live in frontend code.
- **Deployment:** Frontend and backend are deployed and scaled independently (e.g. Vercel + Railway), communicating over HTTPS with CORS locked to the production frontend origin.

## B. Files added

**Backend (all new):**
```
backend/package.json
backend/tsconfig.json
backend/.env.example
backend/.gitignore
backend/README.md
backend/db/schema.sql
backend/src/server.ts
backend/src/config/env.ts
backend/src/config/db.ts
backend/src/middleware/auth.ts
backend/src/middleware/errorHandler.ts
backend/src/middleware/rateLimit.ts
backend/src/routes/submissions.routes.ts
backend/src/routes/auth.routes.ts
backend/src/routes/admin.routes.ts
backend/src/routes/health.routes.ts
backend/src/controllers/submissions.controller.ts
backend/src/controllers/auth.controller.ts
backend/src/controllers/admin.controller.ts
backend/src/services/submissions.service.ts
backend/src/services/email.service.ts
backend/src/services/auth.service.ts
backend/src/validators/submission.validator.ts
backend/src/utils/asyncHandler.ts
backend/src/utils/errors.ts
backend/src/utils/logger.ts
backend/src/types/express.d.ts
backend/src/scripts/migrate.ts
backend/src/scripts/create-admin.ts
```

**Frontend (new):**
```
frontend/src/lib/api.ts
frontend/src/pages/admin-login.tsx
frontend/src/pages/admin-dashboard.tsx
frontend/src/vite-env.d.ts
frontend/.env.example
```

## C. Files modified

- **`frontend/src/App.tsx`** — the submission form now `POST`s to `/api/submissions` with loading/error state and a hidden honeypot field; added the `/admin/login` and `/admin` routes to the router. No sections, copy, or styling were changed.
- **`frontend/src/index.css`** — appended new rules only (form error banner, disabled-button state, honeypot-hiding, and a self-contained admin dashboard style block). No existing rules were changed.
- **`frontend/vite.config.ts`, `frontend/package.json`, `frontend/tsconfig.json`** — de-monorepo'd so the project runs and builds standalone (the original files depended on a Replit-managed pnpm workspace — `catalog:` dependency versions, a `workspace:*` package, and a `tsconfig.base.json` — none of which were included and none of which exist outside that Replit project). Real dependency versions were substituted; the unused `@workspace/api-client-react` dependency was dropped (it wasn't imported anywhere in the source). This was necessary for requirement #15/16 (must not depend on Replit, must be deployable under your own domain).

Everything else in `frontend/` — components, assets, CSS design system, copy — is untouched.

## D. Database setup

Run `backend/db/schema.sql` against your database (via `npm run migrate` from `backend/`, or paste it into the Supabase SQL editor). It creates:

- `startup_submissions` — the submission record, with a `status` check against `submission_status`, indexes on `status`, `created_at`, and `email`, and an auto-updating `updated_at` trigger.
- `submission_counters` — a per-year counter used to generate `MC-2026-00001`-style IDs atomically (safe under concurrent submissions).
- `admin_users` — email + bcrypt password hash. Never insert into this table by hand; use `npm run create-admin`.

The script is idempotent — safe to re-run.

## E. Environment variables

| Variable | Purpose | Where to obtain |
|---|---|---|
| `PORT` | Port the backend listens on | You choose (default `4000`); most hosts set this for you |
| `NODE_ENV` | `development` or `production` | You set this |
| `CORS_ORIGIN` | Comma-separated list of origins allowed to call the API | Your frontend's dev and production URLs |
| `DATABASE_URL` | Postgres connection string | Supabase → Project Settings → Database → Connection string |
| `RESEND_API_KEY` | Auth for sending email | resend.com → API Keys |
| `ADMIN_EMAIL` | Where submission notifications are sent | You choose |
| `FROM_EMAIL` | The "from" address on outgoing email | Must be on a domain verified in Resend |
| `JWT_SECRET` | Signs admin session tokens | Generate yourself: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SESSION_COOKIE_NAME` | Name of the admin session cookie | Optional, has a sensible default |
| `VITE_API_URL` (frontend) | Base URL the frontend calls | Your backend's dev/production URL |

`.env.example` files with these names (no values) are already in both `frontend/` and `backend/`. Never commit the real `.env` — both `.gitignore` files already exclude it.

## F. Local setup

Two terminals:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # fill in real values
npm install
npm run migrate
npm run create-admin
npm run dev                  # http://localhost:4000

# Terminal 2 — frontend
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:5173
```

Visit `http://localhost:5173` for the public site, submit the form, then sign in at `http://localhost:5173/admin/login` with the admin you created.

## G. Email setup

1. Create a [Resend](https://resend.com) account.
2. Verify a sending domain (Resend → Domains) — this becomes your `FROM_EMAIL` domain, e.g. `notifications@my-domain.com`. Until a domain is verified, Resend restricts what you can send from/to.
3. Create an API key (Resend → API Keys) → `RESEND_API_KEY`.
4. Set `ADMIN_EMAIL` to the inbox that should receive new-submission notifications (this can stay `maruthienterprises00777@gmail.com`, matching the existing footer contact, or be changed).
5. Submissions trigger two emails: one to `ADMIN_EMAIL` with the full submission, and a short confirmation to the founder's own email. Both are best-effort — if Resend is down or misconfigured, the submission is still saved (see `backend/src/services/email.service.ts`), and the failure is logged server-side for you to notice and follow up on manually if needed.

## H. Admin setup

Run `npm run create-admin` from `backend/` and follow the prompts (email + password, minimum 12 characters). The password is hashed with bcrypt before it ever touches the database — nothing is stored or logged in plaintext. Re-running the command with the same email resets that admin's password, which is also how you recover access if a password is lost.

## I. Deployment

**Backend (Railway or Render):**
1. Push this repo to GitHub (with `.env` excluded, per `.gitignore`).
2. Create a new service from the repo, root directory `backend/`.
3. Build command: `npm install && npm run build`. Start command: `npm start`.
4. Add all the backend environment variables from section E in the host's dashboard.
5. Provision Postgres — either Supabase (recommended, use its connection string as `DATABASE_URL`) or the host's own Postgres add-on.
6. After the first deploy, run `npm run migrate` and `npm run create-admin` once (most hosts offer a one-off "run command" or shell against the deployed service; alternatively run them locally with `DATABASE_URL` pointed at production).

**Frontend (Vercel):**
1. Import the repo, root directory `frontend/`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add `VITE_API_URL` = your deployed backend URL (e.g. `https://api.my-domain.com`).
4. Deploy.

**Connect them:** set the backend's `CORS_ORIGIN` to your deployed frontend URL(s) (comma-separated if you keep a preview URL too), then redeploy the backend.

## J. Domain setup

1. Point your domain's frontend subdomain (e.g. `www.my-domain.com` or the apex) at Vercel via the DNS records Vercel gives you when you add the domain in its dashboard (usually a `CNAME` for a subdomain, or an `A`/`ALIAS` record for the apex).
2. Point an API subdomain (e.g. `api.my-domain.com`) at your backend host (Railway/Render) the same way — they'll give you a `CNAME` target when you add a custom domain to the service.
3. Update `VITE_API_URL` (frontend) to `https://api.my-domain.com` and `CORS_ORIGIN` (backend) to `https://www.my-domain.com`, then redeploy both.
4. Both hosts issue free TLS certificates automatically once DNS resolves — no manual certificate setup needed.

## K. Testing checklist

- [ ] Public site loads at `/`; nav, animations, images, logo, and responsive layout all match the original
- [ ] Submitting the form with valid data shows the existing success card and a real `submissionId`
- [ ] Submitting with an invalid email is rejected with a clear message
- [ ] Submitting with required fields empty is rejected, each field's error shown
- [ ] Submitting a very long `description`/`resources` (past the schema limits) is rejected
- [ ] Submitting 6+ times rapidly from the same IP gets rate-limited on the 6th attempt
- [ ] The admin notification email and founder confirmation email both arrive
- [ ] Temporarily using an invalid `RESEND_API_KEY` still results in a successful submission (check the row exists in `startup_submissions`) with the failure visible in server logs
- [ ] `GET /api/admin/submissions` without a session cookie returns `401`
- [ ] Admin login with correct credentials succeeds and sets a cookie; wrong password returns a generic `401`
- [ ] Admin dashboard lists stored submissions, search and status filter both narrow the list
- [ ] Changing a submission's status/notes in the dashboard persists after a page refresh
- [ ] Admin logout clears the session; `/admin` afterward redirects to `/admin/login`
- [ ] Mobile viewport: public site and admin dashboard both remain usable
- [ ] `GET /api/health` returns `{"status":"ok"}` with no extra system detail
