# Lead Hook — Build Plan

## Phase 1 — Lead Capture + Instant Response ✅

### Lead Intake
- [x] `POST /api/leads` — create lead in DB
- [x] `POST /api/webhooks` — normalize external payloads (Facebook Ads, forms) and forward to `/api/leads`
- [x] Instant SMS on lead creation via Twilio
- [x] Log initial SMS to `activities` table in `POST /api/leads`
- [x] Return proper error if Twilio send fails (don't 500 — save lead, flag SMS failure)

### Data Layer
- [x] Drizzle schema — `leads` + `activities` tables
- [x] Drizzle config + migration setup
- [x] Seed script (`src/db/seed.ts`) with 5 sample leads for local dev
- [ ] Run `bun db:migrate` against real DB
- [ ] Run `bun db:seed` to populate local dev data

---

## Phase 2 — Follow-Up Sequences + Status Tracking ✅

### Twilio Inbound SMS (Reply Detection)
- [x] Create `POST /api/webhooks/sms` route to receive Twilio inbound message callbacks
- [x] Validate `X-Twilio-Signature` header (enforced in production)
- [x] Match inbound `From` number to a lead in DB (lookup by `phone`)
- [x] Update matched lead status → `replied`
- [x] Insert activity record: `type: sms`, `outcome: replied`
- [ ] Configure Twilio phone number webhook URL to point to `/api/webhooks/sms`

### Follow-Up Automation
- [x] Create `POST /api/follow-up/run` — processes ALL active leads in one call (for cron)
- [x] Check if a follow-up is due today using `shouldSendFollowUp()`
- [x] Send SMS, log activity, update `last_contacted_at`
- [x] Rotating follow-up messages (3 variants based on contact count)
- [x] Secure with `CRON_SECRET` bearer token
- [ ] Set up Railway Cron Job service calling `/api/follow-up/run` daily at 9am

### Status Tracking
- [x] `PATCH /api/leads/[id]` — update status, sets `last_contacted_at` on `contacted`
- [x] `GET /api/leads/[id]` — fetch single lead
- [x] `GET /api/leads/[id]/activities` — activity log for a lead, newest first

---

## Phase 3 — Dashboard (Daily Action List)

### Auth UI
- [x] Create `src/lib/auth-client.ts` — BetterAuth browser client
- [x] Create `src/app/(auth)/sign-in/page.tsx` — sign-in form
- [x] Create `src/app/(auth)/sign-up/page.tsx` — sign-up form
- [x] Add `src/middleware.ts` to protect `/` and all non-auth routes
- [x] Redirect unauthenticated users to `/sign-in`

### Dashboard — Read
- [x] `GET /api/leads` — list all leads ordered by priority (hot → warm → cold)
- [x] `LeadList` component — displays name, phone, source, status badge, suggested action
- [x] Show lead count per section (e.g. "3 Hot")
- [x] Show leads created today — "New Today" section
- [x] Empty state when no leads exist
- [ ] Loading skeleton while data fetches

### Dashboard — Write (Agent Actions)
- [x] "Mark Contacted" button on each lead card → `PATCH /api/leads/[id]` `{ status: "contacted" }`
- [x] "Mark Closed" button → `PATCH /api/leads/[id]` `{ status: "closed" }`
- [x] Optimistic UI update (update list immediately, revert on error)
- [x] "Add Lead" button → modal form with name, phone, email, source → `POST /api/leads`
- [x] Confirmation toast on success / error

### Lead Detail View
- [x] Clicking a lead opens `src/app/leads/[id]/page.tsx`
- [x] Show full lead info + activity timeline
- [x] Show AI-suggested reply (call `generateReply()` from `src/lib/openai.ts`)
- [x] Manual "Send SMS" button with custom message input
- [x] Notes field — `notes: text` column added to schema, auto-saves on change

---

## Phase 4 — Integrations + Polish

### Email Follow-Up
- [ ] Add email step to follow-up sequence (Day 3 = email instead of SMS)
- [ ] Create email template in `src/lib/email-templates.ts`
- [ ] Update `POST /api/follow-up/run` to send email on Day 3
- [ ] Log email activities to `activities` table

### Webhook Hardening
- [ ] Handle duplicate leads (same phone/email) — upsert or reject with 409
- [ ] Rate limit `/api/webhooks` (max 100 req/min)

### Observability
- [ ] Add `/api/health` route returning DB connection status + timestamp
- [ ] Track follow-up sequence completion rate (leads that reached Day 5 with no reply)

---

## Phase 5 — Deployment (Railway)

- [ ] Create Railway project + add PostgreSQL plugin
- [ ] Set all environment variables in Railway Variables panel:
  - `DATABASE_URL` (auto-injected by Railway Postgres plugin)
  - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
  - `BETTER_AUTH_URL` — your Railway public URL (e.g. `https://lead-hook.up.railway.app`)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
  - `RESEND_API_KEY`
  - `OPENAI_API_KEY`
  - `CRON_SECRET` — `openssl rand -hex 32`
- [ ] Push to GitHub repo connected to Railway → confirm build passes
- [ ] Run `bunx drizzle-kit migrate` against Railway DB (one-time via Railway shell)
- [ ] Add Railway Cron Job service → `POST https://your-app.up.railway.app/api/follow-up/run` daily at 9am with header `Authorization: Bearer $CRON_SECRET`
- [ ] Update Twilio phone number inbound webhook URL → `https://your-app.up.railway.app/api/webhooks/sms`
- [ ] Smoke test: submit test lead → confirm SMS fires → reply to SMS → confirm lead flips to Hot in dashboard

---

## Backlog (Post-MVP)

- [ ] Multi-agent routing — assign leads to specific agents
- [ ] AI reply suggestions inline in dashboard (not just detail view)
- [ ] CRM export (CSV download of all leads)
- [ ] Email open/click tracking via Resend webhooks
- [ ] Slack notification when a lead replies
- [ ] Follow-up sequence editor (customize day schedule + messages per source)
