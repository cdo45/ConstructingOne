# Vance Corp Sub Billing Portal

A local development build of the Vance Corp subcontractor billing and change order
portal. Built with Next.js 14 (App Router), TypeScript, Tailwind, Prisma/SQLite, and a
mocked JWT auth layer.

The production target is Vercel + Neon Postgres. SQLite is used locally — the schema
mirrors what will run in Postgres; switch by changing `DATABASE_URL` in `.env.local`.

## Setup

```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Set up env
cp .env.example .env.local
# (The repo ships with a ready-to-use .env.local for local dev.)

# 3. Initialize DB + seed
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 4. Run
npm run dev
# open http://localhost:3000/login
```

## Test Credentials

| Role         | Email                | Password  |
| ------------ | -------------------- | --------- |
| Admin        | admin@vance.com      | test1234  |
| PM           | pm1@vance.com        | test1234  |
| PM           | pm2@vance.com        | test1234  |
| Sub (Acme)   | sub1@acme.com        | test1234  |
| Sub (Elite)  | sub2@paving.com      | test1234  |
| Sub (Titan)  | sub3@grading.com     | test1234  |

## Running the tests

```bash
# The integration tests need the dev server running.
npm run dev &          # in another shell
npm test
```

15 tests across two suites:
- `__tests__/billing-calculations.test.ts` — pure math (lump sum, unit price, cumulative, balance, CO impact).
- `__tests__/api.test.ts` — live API integration (login, role-based access, CO state flow).

## API quick reference

All `/api/*` routes require `Authorization: Bearer <token>` except `/api/auth/login`.

```bash
# Log in
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pm1@vance.com","password":"test1234"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).data.token))')

# List projects
curl http://localhost:3000/api/projects -H "Authorization: Bearer $TOKEN"

# Dashboard summary
curl http://localhost:3000/api/dashboard/summary -H "Authorization: Bearer $TOKEN"

# Project detail
curl http://localhost:3000/api/projects/<id> -H "Authorization: Bearer $TOKEN"

# Export one billing period (PDF/XLSX/CSV)
curl -o billing.pdf "http://localhost:3000/api/export/billing/<periodId>?format=pdf" \
  -H "Authorization: Bearer $TOKEN"
curl -o billing.xlsx "http://localhost:3000/api/export/billing/<periodId>?format=xlsx" \
  -H "Authorization: Bearer $TOKEN"

# Master G703 across all subs on a project
curl -o master.pdf "http://localhost:3000/api/export/project/<projectId>/master?format=pdf" \
  -H "Authorization: Bearer $TOKEN"
```

## Key routes (UI)

- `/login` — common login page for all roles
- `/dashboard` — PM/Admin dashboard
- `/projects` — PM/Admin project list
- `/projects/[id]` — Project detail with Overview / Billing / Change Orders / Contracts tabs
- `/sub-portal` — Sub portal: list of contracts + current billing status
- `/sub-portal/billing/[id]` — Sub billing entry screen (lump sum % or unit price qty)

## Status flow

**Billing period:** `draft → submitted → approved` or `rejected (→ draft again)`
**Change order:** `pending → pm_approved → customer_approved`, or `rejected`

## Data model (`prisma/schema.prisma`)

```
User(admin | pm | subcontractor)
  ↓
Project --< Contract --< LineItem (lump_sum or unit_price)
   ↓           ↓
   ↓           └-- BillingPeriod --< BillingLineItem
   └-- ChangeOrder
          ↓
       Approval
```

## Environment variables

See `.env.example`.

- `DATABASE_URL` — SQLite file locally (`file:./dev.db`); swap for Neon Postgres in prod.
- `JWT_SECRET` — secret for signing session JWTs.
- `JWT_EXPIRES_IN` — defaults `7d`.
- `NEXT_PUBLIC_APP_URL` — base URL for the app.

## Known limitations (local build)

- Auth is **mocked** — a hardcoded JWT secret and bcrypt compare against the seeded
  users. No Clerk / Supabase integration yet.
- Middleware is intentionally minimal — API routes enforce their own role checks.
- No file upload for CO attachments yet (description/notes only).
- Mobile responsive is functional but not polished — desktop is the target.

## Next steps for production

1. Swap `DATABASE_URL` to a Neon connection string; run `prisma migrate deploy`.
2. Replace the mock JWT layer with the real auth provider (Clerk recommended per docs).
3. Add file upload (S3 or Vercel Blob) for CO supporting documents.
4. Deploy to Vercel.
