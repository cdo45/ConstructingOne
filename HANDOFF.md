# ConstructingOne — Engineering Handoff

> One-page brief for the senior engineer joining ConstructingOne. Current as of 2026-05-29.

---

## 1. What this is

**ConstructingOne** is a refounded product: accounting and project-management software for contractors. It consolidates six standalone Next.js apps the founder built at a prior employer (Vance Corp) into a single monorepo under his independent ownership. The six apps were repos in the founder's personal GitHub (`github.com/cdo45/*`) — they are now subdirectories of `cdo45/ConstructingOne` with full git history preserved.

Vance Corp branding is being removed from the product layer. The handoff is documented through git tags on the original repos (see §6).

The product surface at this moment is just the six apps. There is **no** unified shell, auth, billing, or marketing site yet — those are the work ahead.

---

## 2. Repo at a glance

```
ConstructingOne/
├── README.md              # one-line product tagline
├── HANDOFF.md             # this file
├── .gitignore             # standard Node/Next ignore
└── apps/
    ├── README.md          # monorepo index
    ├── ar-reports/        # ← cdo45/AR-Reports
    ├── core-metrics/      # ← cdo45/core-construction-metrics
    ├── subcontractor-portal/  # ← cdo45/subcontractor-billing-portal
    ├── fixed-assets/      # ← cdo45/fixed-assets-tracker  (essentially empty)
    ├── wip-report/        # ← cdo45/WIP-Report
    └── ar-billing/        # ← cdo45/Vance-AR-Billing
```

Each app currently runs **independently** with its own `package.json`, lockfile, Next.js install, Tailwind config, and (where applicable) database client. There is **no monorepo tooling yet** — no Turborepo, no Nx, no pnpm workspace, no shared `tsconfig`. Each app is a self-contained checkout that happens to share a parent directory.

---

## 3. Branch / PR state

| Item | Value |
| --- | --- |
| Default branch | `main` |
| `main` HEAD | `d134a0d` — initial commit (just the README + .gitignore) |
| Active feature branch | `claude/consolidate-monorepo-x9YPy` |
| Commits ahead of main | 8 (1 scaffold + 6 subtree merges + 1 rebrand) + ~342 historical source commits interleaved |
| Total reachable commits | 312 |
| Open draft PR | **[#1 — Consolidate 6 prior apps into ConstructingOne monorepo (subtree merges)](https://github.com/cdo45/ConstructingOne/pull/1)** |

Nothing has been merged to `main` yet. PR #1 is currently the only change.

### The 8 commits on the feature branch

| SHA | Subject |
| --- | --- |
| `768d3d6` | Rebrand: consolidate prior apps into ConstructingOne monorepo |
| `7d1384a` | Add 'apps/ar-billing/' from commit '8282cfb...' |
| `6b7c0e3` | Add 'apps/wip-report/' from commit '8a919e4...' |
| `9abcbda` | Add 'apps/fixed-assets/' from commit 'a025248...' |
| `7b2925e` | Add 'apps/subcontractor-portal/' from commit '473331d...' |
| `740fd16` | Add 'apps/core-metrics/' from commit '2d42334...' |
| `66a5748` | Add 'apps/ar-reports/' from commit '09c3b5f...' |
| `82f4d4d` | Add apps/ scaffold for monorepo subtree merges |

---

## 4. Per-app summary

> All apps are Next.js App Router + TypeScript + Tailwind. Differences below.

### 4.1 `apps/ar-reports` — AR aging & collections analytics

| | |
| --- | --- |
| Package name | `ar-reports` |
| Source HEAD at merge | `09c3b5f` |
| Source commits in history | 24 |
| Code size | **3,463 LOC** across 26 TS/TSX files |
| Next version | 14.2.18 |
| Database | Neon serverless Postgres (`@neondatabase/serverless@0.10.4`) |
| Migrations | Hand-rolled SQL in `db/migrations/` (1 file), runner in `db/migrate.ts` |
| Charts | recharts 2.13 |
| Tables | `@tanstack/react-table` 8.20 |
| Routes | `/dashboard`, `/customers`, `/rankings`, `/forecast`, `/upload`, `/api/uploads` |
| Scripts | `dev`, `build`, `start`, `lint`, `db:migrate` |
| Status | Working app. Cash forecasting with 3 scenarios shipped (see commit `d3653bb`). |

### 4.2 `apps/core-metrics` — Weekly KPI dashboard with drilldowns

| | |
| --- | --- |
| Package name | `core-construction-metrics` *(needs renaming to drop Vance lineage)* |
| Source HEAD at merge | `2d42334` |
| Source commits in history | 207 (largest, most active app) |
| Code size | **16,266 LOC** across 69 TS/TSX files |
| Next version | **`^16.2.3`** — note: Next 16 doesn't exist yet; this resolves to 14.x via semver. Probably a typo in source repo's package.json. **Worth fixing.** |
| Database | Neon serverless Postgres |
| Migrations | Hand-rolled SQL in `db/migrations/` (1 file currently — most schema is squashed) |
| Charts | recharts 3.8 |
| Icons | lucide-react |
| Routes (heavy API surface) | `/dashboard`, `/import`, `/setup`, `/weeks`, plus 11 API routes: `/api/gl-accounts`, `/api/seed`, `/api/pnl-breakdown`, `/api/admin`, `/api/transactions`, `/api/metrics`, `/api/excluded-accounts`, `/api/projections`, `/api/categories`, `/api/migrations` |
| Status | The most complex app. Recent commit history shows KPI drilldown formulas work (`feat/kpi-drilldown-formulas` merged). |

### 4.3 `apps/subcontractor-portal` — Sub billing intake & approvals

| | |
| --- | --- |
| Package name | `vance-sub-billing` *(needs renaming)* |
| Source HEAD at merge | `473331d` |
| Source commits in history | 6 (small but recent — fast-built app) |
| Code size | **4,789 LOC** across 45 TS/TSX files |
| Next version | 14.2.16 |
| Database | **Prisma + Postgres** (`@prisma/client@5.22.0`) — the only app using Prisma. Others use raw SQL. |
| Auth | Has `middleware.ts` and `/login` route — implies session/cookie auth (worth reading the middleware) |
| UI library | **`@radix-ui` primitives** — `react-dialog`, `react-select`, `react-tabs` (the only app using Radix) |
| Tests | Jest configured (`__tests__/`, `jest.config.js`) — the only app with tests |
| Routes | `/dashboard`, `/login`, `/projects`, `/projects/[id]`, `/sub-portal`, plus API: `/api/change-orders`, `/api/projects`, `/api/users`, `/api/auth`, `/api/export`, `/api/billing`, `/api/sub`, `/api/contracts`, `/api/dashboard` |
| Scripts | `dev`, `build`, `start`, `lint`, `test`, `db:migrate`, `db:seed`, `db:studio` |
| Notes | Includes a `PROGRESS.md` file from prior work. README mentions "Vance Corp Sub Billing Portal" — needs re-branding. |

### 4.4 `apps/fixed-assets` — *(empty stub)*

| | |
| --- | --- |
| Source HEAD at merge | `a025248` ("Initial commit") |
| Source commits in history | **1** |
| Code size | **0 LOC** — only a `.gitignore` exists |
| Status | This was never started. The source repo was a placeholder. Treat as a green-field build, but the *concept* is part of the v1 surface (equipment register, depreciation, location tracking, disposal workflows). |

### 4.5 `apps/wip-report` — Percentage-of-completion / WIP schedules

| | |
| --- | --- |
| Package name | `wip-report` |
| Source HEAD at merge | `8a919e4` |
| Source commits in history | 75 |
| Code size | **5,703 LOC** across 31 TS/TSX files |
| Next version | 14.2.35 |
| Database | Neon serverless Postgres (`@neondatabase/serverless@1.0.2`) — uses the newer 1.x driver |
| Migrations | Raw SQL: `db/schema.sql`, `db/migrations/`, plus `db/seed.ts` and `db/index.ts` |
| Charts | recharts 3.8 |
| Source layout | Uses `src/app/` (App Router under src/) — different from ar-reports which uses `/app/` at root |
| Routes | `/dashboard`, `/jobs`, `/jobs/new`, `/jobs/[id]`, `/wip`, `/wip/[id]`, `/history`, plus `/api/jobs`, `/api/wip-reports` |
| Status | Recently active. Last commit fixed an urgent save bug. |

### 4.6 `apps/ar-billing` — AIA-style billing & change orders

| | |
| --- | --- |
| Package name | `vance-ar-billing` *(needs renaming)* |
| Source HEAD at merge | `8282cfb` |
| Source commits in history | 29 |
| Code size | **4,541 LOC** across 24 TS/TSX files |
| Next version | 14.2.35 |
| Database | Neon serverless Postgres (`@neondatabase/serverless@1.0.2`) — note: **no `db/` or `prisma/` directory at the top level**. DB logic likely lives in `lib/`. Check `lib/` and `api/` routes for the data layer. |
| Charts | recharts 3.8 |
| Deploy | Has `netlify.toml` — was/is deployed to Netlify |
| Routes | `/jobs`, `/invoices`, `/customers`, `/reports`, plus API: `/api/jobs`, `/api/companies`, `/api/invoices`, `/api/customers`, `/api/entries`, `/api/reports`, `/api/health`, `/api/debug` |
| Notes | Has a `data/` directory at top level — worth understanding what's in there (seed data? fixtures?). |

### Quick cross-app comparison

| Concern | ar-reports | core-metrics | subcontractor-portal | wip-report | ar-billing | fixed-assets |
| --- | --- | --- | --- | --- | --- | --- |
| Next major | 14.2.18 | 14.2.x¹ | 14.2.16 | 14.2.35 | 14.2.35 | — |
| DB driver | Neon 0.10 | Neon 0.10 | Prisma 5.22 | Neon 1.0 | Neon 1.0 | — |
| Charts | recharts 2 | recharts 3 | recharts 2 | recharts 3 | recharts 3 | — |
| Has tests | no | no | **yes (jest)** | no | no | — |
| Has middleware/auth | no | no | **yes** | no | no | — |
| `src/` layout | no | **yes** | no | **yes** | no | — |
| Has Radix | no | no | **yes** | no | no | — |

¹ Declared as `^16.2.3` in `package.json` but resolves to 14 since Next 16 doesn't exist. Bug.

**Implications for shared tooling:**
- Two different Neon driver majors (0.x vs 1.x) — pick one to standardize on
- recharts 2 vs 3 — recharts 3 was a significant rewrite; both are in production today
- Two different App Router conventions (`/app/` vs `/src/app/`)
- Only one app has tests and one has auth — the others will need both
- Only subcontractor-portal uses Prisma — the rest are raw SQL. Decision: keep Prisma for that one, or migrate everything to a single ORM choice.

---

## 5. Sensitive-data scan (run before tagging)

Every source repo was scanned (working tree + full git history) before any tagging or merging:

- **`.env` files:** none committed in any repo. Only `.env.example` / `.env.local.example` templates with placeholder Postgres URLs (`postgresql://user:password@host/database?sslmode=require`).
- **Credential pattern scans:** no matches for JWTs, AWS access keys (`AKIA…`), Google API keys (`AIza…`), GitHub PATs (`ghp_…` / `github_pat_…`), OpenAI keys (`sk-…`), Anthropic keys (`sk-ant-…`), Slack tokens, Bearer tokens with non-trivial values, or `BEGIN PRIVATE KEY` blocks.
- **Loose `KEY|SECRET|PASSWORD|TOKEN=…` assignments to concrete strings:** zero matches.
- **Data files:** only schema/migration `.sql` files exist (DDL only). One INSERT across all 6 repos, in `apps/ar-reports/db/migrations/001_init.sql`:
  ```sql
  INSERT INTO app_settings (key, value) VALUES ('forecast_as_of', NULL) ON CONFLICT DO NOTHING;
  ```
  Schema config seed, not customer data.

**Bottom line: the history is clean. Safe to publish.**

---

## 6. Handoff snapshot tags

Before merging anything, the founder pushed an annotated tag to **each** of the six source repos pinning the HEAD at the moment of departure from Vance Corp. These serve as the legal/clean snapshot of what was handed off.

| Source repo | Tag | HEAD commit |
| --- | --- | --- |
| cdo45/AR-Reports | `vance-handoff-2026-05-06` | `09c3b5f` |
| cdo45/core-construction-metrics | `vance-handoff-2026-05-06` | `2d42334` |
| cdo45/subcontractor-billing-portal | `vance-handoff-2026-05-06` | `473331d` |
| cdo45/fixed-assets-tracker | `vance-handoff-2026-05-06` | `a025248` |
| cdo45/WIP-Report | `vance-handoff-2026-05-06` | `8a919e4` |
| cdo45/Vance-AR-Billing | `vance-handoff-2026-05-06` | `8282cfb` |

Message on each tag: `State at end of Vance employment`.

A `constructingone-v0.1.0` tag will be applied to `main` *after* PR #1 merges (intentionally not on the feature branch).

---

## 7. What is NOT done yet

### Immediate
- **Root homepage / landing page** is in design but not built. Spec is a refined-minimalist black-and-white editorial page with Instrument Serif + Manrope + JetBrains Mono via `next/font`, a hero, a 6-card features grid (one per app), and a minimal footer. Scaffold was started and rolled back to keep the repo clean while this handoff was prepared. **Pickup point:** scaffold Next.js 14 at root, build `app/{layout,page}.tsx` + `app/globals.css`, install with npm.
- **Rename packages** to drop "vance" prefix:
  - `core-construction-metrics` → e.g. `@constructingone/core-metrics`
  - `vance-sub-billing` → `@constructingone/subcontractor-portal`
  - `vance-ar-billing` → `@constructingone/ar-billing`
- **Fix the bad Next version** in `apps/core-metrics/package.json` (`^16.2.3` → `14.2.x`).
- **Rewrite the subcontractor-portal README** which still says "Vance Corp Sub Billing Portal".

### Monorepo decisions (someone needs to decide)
1. **Tooling:** Turborepo? Nx? Plain pnpm workspaces? Each is defensible. Recommendation: pnpm workspaces + Turborepo for build orchestration — light, fast, idiomatic for Next.js.
2. **Shared packages:** A `packages/ui` (design system), `packages/db` (shared Neon client + types), `packages/auth` (single auth surface) are the obvious extractions.
3. **Database strategy:** Do all 5 functional apps share one Postgres database with separate schemas, or stay separate? This affects shared types significantly.
4. **Single-host auth:** Currently only subcontractor-portal has auth. The product needs one identity provider across all apps. Options: Clerk, Auth.js, WorkOS, Supabase Auth, Stack Auth.
5. **Routing strategy:** Single Next.js app with route groups (`app/(ar-reports)/…`), or keep apps separate behind a reverse proxy / Vercel project per app? The current "six independent Next.js apps" structure won't scale to a unified UX.
6. **Driver standardization:** Pick one of `@neondatabase/serverless` 0.x vs 1.x vs another postgres client. Prisma stays or goes.

### Product / GTM
- No marketing site, no docs site, no signup flow, no billing, no email/notifications, no observability (no Sentry, no analytics).

### Source repo cleanup (founder will do)
- Archive the six source repos on GitHub once this PR merges. The `vance-handoff-2026-05-06` tag preserves the snapshot regardless.

---

## 8. Conventions established so far

- **Branch naming:** `claude/<short-slug>-<random>` for AI-assisted work; the founder will use his own conventions otherwise.
- **Commits:** conventional-ish but not strict. Subtree merge commits use git's auto-generated `Add 'apps/X/' from commit '<sha>'` format.
- **Tags:** annotated only. Reserve `vance-handoff-*` for the legal handoff snapshots; product versions use `constructingone-vX.Y.Z`.
- **PRs:** draft until ready for review. Bodies use a `## Summary` / `## Test plan` template.

---

## 9. How to run something today

There is no `pnpm install` at root yet — nothing at the root is wired up. To run any of the apps right now:

```bash
cd apps/<app-name>
npm install   # or pnpm, but no workspace exists yet
# set up .env.local from .env(.local).example with a Neon connection string
npm run db:migrate   # where applicable (ar-reports, subcontractor-portal)
npm run dev
```

Each app expects its own `DATABASE_URL`. There is no shared `.env` strategy.

---

## 10. Open questions for the senior engineer

1. Monorepo tooling choice (Turborepo vs Nx vs bare pnpm)?
2. Unify-into-one-Next-app vs keep-six-deployments?
3. Standardize on Neon driver 1.x and drop Prisma, or commit to Prisma everywhere?
4. Which auth provider?
5. Are the six product surfaces the v1 scope, or should `fixed-assets` (currently a stub) wait until v1.5?
6. CI strategy — GitHub Actions, what to run on PRs?
7. Hosting target — Vercel (default for Next), Netlify (one app currently uses it), or self-hosted?

---

*Last updated: 2026-05-29 by the consolidation session (Claude Code).*
