<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/banner-dark.svg">
  <img alt="Corridor — supply-and-compliance marketplace for European energy & data-center EPC crews" src="docs/banner-light.svg" width="100%">
</picture>

<p align="center">
  <sub><b>The supply-and-compliance marketplace for mid-term, infrastructure-equipped workforce housing — built for European energy & data-center EPC crews.</b></sub>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.1.4-22d3ee?style=flat-square&logo=nextdotjs&logoColor=0a0e1a" alt="Next.js 15.1.4"></a>
  <img src="https://img.shields.io/badge/React-19-ff5dba?style=flat-square&logo=react&logoColor=0a0e1a" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-9d7bff?style=flat-square&logo=typescript&logoColor=0a0e1a" alt="TypeScript 5.7">
  <img src="https://img.shields.io/badge/Prisma-5.22-4697b1?style=flat-square&logo=prisma&logoColor=ffffff" alt="Prisma 5.22">
  <img src="https://img.shields.io/badge/Tailwind-3.4-22d3ee?style=flat-square&logo=tailwindcss&logoColor=0a0e1a" alt="Tailwind 3.4">
  <img src="https://img.shields.io/badge/Zod-3.23-9d7bff?style=flat-square" alt="Zod 3.23">
  <img src="https://img.shields.io/badge/SQLite-local-0891b2?style=flat-square&logo=sqlite&logoColor=ffffff" alt="SQLite local">
  <img src="https://img.shields.io/badge/tsc_--noEmit-passing-22c55e?style=flat-square&logo=typescript&logoColor=0a0e1a" alt="tsc clean">
  <img src="https://img.shields.io/badge/license-private-d4d8df?style=flat-square" alt="private">
</p>

---

Corridor matches EPC firms and hyperscalers (**procurement / clients**) with vetted housing vendors (**supply / partners**) who can host crews plus their secured infrastructure — fenced yards, laydown, HGV access, insured storage — next to offshore-wind, solar, substation and hyperscaler build sites. The compliance-anchored revenue model is an **8–10% host commission** (waived the first 90 days), a **12–15% enterprise take** (default 13%), a **€750/site/month SaaS fee**, and **19% VAT**.

This repository is a fullstack reference implementation that reproduces the whitepaper's worked example — **600 crew × 9 months × €1,400/person/month = €7.56M gross → ~€983K corridor take** — and lets you click through every role surface that produces those numbers.

### ▸ system map

```
        ┌──────────────┐                          ┌──────────────┐
        │   CLIENT     │   1. browse listings     │   PARTNER    │
        │ procurement  │ ───────────────────────▶ │ supply vendor │
        │ EPC / hyper  │ ◀─────────────────────── │ vetted host   │
        └──────┬───────┘   2. booking request      └───────┬───────┘
               │ 3. deploy crew                      9% commission
               ▼                                          ▼
      ┌───────────────────────────────────────────────────────────┐
      │                      C O R R I D O R                     │
      │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │
      │  │ pricing-engine │  │ compliance-    │  │  audit log │  │
      │  │  €·bps·VAT     │  │ vault/accredit │  │  immutable │  │
      │  └───────┬────────┘  └───────┬────────┘  └────────────┘  │
      │          │                   │                            │
      │          └─────────┬─────────┘                            │
      │                    ▼                                       │
      │          [take 13% + €750/site + 19% VAT]  ⟶  invoice     │
      └───────────────────────────────────────────────────────────┘
          ▲ middleware JWT gate (role-prefix)     belt ▒▒ suspenders (can())
          └──────────── server actions: no REST surface ────────────┘
```

**No paid services are required.** Everything runs locally on SQLite + the local filesystem for the document vault.

---

## ▸ nav

| jump | what |
|------|------|
| [Stack](#-stack) | framework, ORM, auth, validation |
| [Quick start](#-quick-start) | 5 commands to running + demo logins |
| [The economics](#-the-economics-whitepaper-reproduction) | the one pricing engine that can't drift |
| [Architecture](#-architecture) | money, auth, docs, invoices, accreditation, audit |
| [Role surface map](#-role-surface-map) | partner / client / admin dashboards |
| [Verified](#-verified) | typecheck, build, and smoke-test report |
| [Project structure](#-project-structure) | repo map |
| [Notes & limitations](#-notes--limitations) | prod-portability checklist |

---

## ▸ stack

```
next@15.1.4 (App Router) · react@19 · typescript@5.7        ─ UI
prisma@5.22  on SQLite (file:./dev.db) ─ portable→Postgres ─ data
tailwind@3.4 custom ink / weld / sea palette                ─ style
zod@3.23 single source of truth                             ─ validation
bcryptjs (hash) + jose (HS256 httpOnly session JWT)          ─ auth
server actions: useFormState((prevState, formData)=>Result) ─ no REST
```

No paid services are required. Everything runs locally on SQLite + the local filesystem for the document vault.

---

## ▸ quick start

```bash
# 1. Install (postinstall runs prisma generate)
npm install

# 2. Configure environment
cp .env.example .env   # or edit the existing .env — SESSION_SECRET must be >= 16 chars
# Required: SESSION_SECRET, DATABASE_URL, UPLOAD_DIR, APP_BASE_URL

# 3. Create the schema and seed demo data
npm run db:migrate      # prisma generate + migrate dev --name init
npm run db:seed         # tsx prisma/seed.ts — orgs, users, listings, deployments, an invoice + payouts

# 4. Run
npm run dev             # http://localhost:3000  (hot reload)
# — or —
npm run build && npm run start   # production server

# 5. Verify
npm run typecheck       # tsc --noEmit
```

### demo credentials

> Every seeded user shares the password **`Corridor2026!`**. Sign in at `/login`.

| Role     | Email                          | Lands on    |
|----------|--------------------------------|-------------|
| **ADMIN**    | `ops@corridor.example`         | `/admin`    |
| **STAFF**    | `compliance@corridor.example`  | `/admin`    |
| **PARTNER**  | `partner1@corridor.example`    | `/partner`  |
| **CLIENT**   | `client1@corridor.example`     | `/client`   |

There are six partners (`partner1…6@corridor.example`) and six clients (`client1…6@corridor.example`) if you want to see a different org's data.

### smoke-test helper

`scripts/mint-token.mjs` mints a valid `corridor_session` JWT for a seeded user without going through the login UI — handy for curl-ing authenticated routes:

```bash
node scripts/mint-token.mjs ops@corridor.example
# prints a JWT; use it as a cookie:
curl -H "Cookie: corridor_session=$(node scripts/mint-token.mjs client1@corridor.example)" http://localhost:3000/client/invoices
```

---

## ▸ the economics (whitepaper reproduction)

The pricing engine in `src/lib/pricing.ts` is the **single source of truth** for every euro figure on the platform. The marketing `/calculator` and `/pricing` pages, the deployment economics snapshot, and invoice issuance all call the same `computeDeploymentEconomics` / `computeCrewScenario` functions, so the numbers can never drift from the whitepaper.

**Worked example** (`WHITEPAPER_REFERENCE`): 600 crew, 9 months, €1,400/person/month, 6 sites, 13% enterprise take.

```
gross housing + infra ─▶ enterprise take 13% ─▶ add SaaS ─▶ + 19% VAT
   600 × 9 × €1,400         gross × 1300 bps      6×9×€750        revenue × 1900 bps
   = €7,560,000             = €982,800            = €40,500       = €194,427
        └──────────────────────────────────────────┘
                            corridor take (ex-VAT) = €1,023,300
                            client pays (incl VAT) = €8,748,727
```

| Line                       | Formula                                  | Value          |
|----------------------------|------------------------------------------|----------------|
| Gross housing + infra      | 600 × 9 × €1,400                         | €7,560,000     |
| Enterprise take (13%)      | gross × 1300 bps                         | €982,800       |
| SaaS fee (6 sites × 9 mo)  | 6 × 9 × €750                             | €40,500        |
| Corridor revenue (ex-VAT)  | take + SaaS                              | **€1,023,300** |
| VAT (19%)                  | revenue × 1900 bps                       | €194,427       |
| Client pays (incl. VAT)    | gross + corridor revenue + VAT            | €8,748,727     |

Default config (`DEFAULT_PRICING`):

| Knob                  | Default | Whitepaper band |
|-----------------------|---------|------------------|
| Host commission       | 9.00%   | 8–10% (waived first 90 days) |
| Enterprise take       | 13.00%  | 12–15%           |
| SaaS fee              | €750    | per site / month |
| VAT                   | 19.00%  | applied ex-VAT   |

Admins retune all five knobs live on `/admin/rates`; the next invoice/quote picks up the new config via `getActiveConfigFor` (lazy recompute — historical rows are never migrated).

---

## ▸ role surface map

### supply partner — `/partner`
- **Dashboard** — live listings, pending bookings, accrued payout, this-month booking value, accreditation cycles
- **My listings** — list / new / detail / edit; submit for review; archive
- **Compliance vault** — upload documents (org-wide or listing-scoped) across 13 categories; verify-status tracking
- **Booking requests** — accept / decline / counter client requests on your listings
- **Payouts** — scheduled vs paid, net of commission
- **Accreditation** — your approved-supplier cycles with each client

### procurement client — `/client`
- **Dashboard** — active deployments, crew housed, open invoices, pending bookings, approved vendors
- **Browse listings** — server-filtered marketplace (search, country, project type, sleeps, parking, storage, secured-infra flags, max rate, sort) + detail page with the full secure-infrastructure spec, compliance evidence, and a booking-request form
- **Deployments** — list / new / detail; add sites from the marketplace, snap the economics, set status, issue a consolidated invoice for a billing window
- **Booking requests** — confirm-and-contract accepted/countered requests, or withdraw
- **Invoices** — one consolidated invoice per deployment per window with per-site line items; mark paid / void
- **Approved vendors** — your approved-supplier cycles, tracking which vault categories each client requires

### platform admin / compliance staff — `/admin`
- **Dashboard** — partners, clients, live listings, review backlog, open invoice value, live take rate, recent audit
- **Listing review** — approve `PENDING_REVIEW` to publish; suspend `LIVE` listings
- **Document review** — verify / reject vault documents with reviewer notes
- **Deployments** — read-only platform-wide view (clients drive the lifecycle)
- **Invoices / Payouts** — platform-wide settlement view; corridor take + SaaS = platform revenue
- **Accreditations** — open a new client↔partner cycle and drive it through the lifecycle
- **Take-rate config** — the single economic knob (admin-only; staff see read-only)
- **Users & orgs** — every org and user on the platform
- **Audit log** — append-only mutation trail

---

## ▸ architecture

### money, percentages, enums
- **Money** is stored as integer EUR cents. **Percentages** are basis points (`1300` = 13.00%). **Enums** are `String` unions in TS + `String` columns in Prisma (keeps SQLite trivial; ports to Postgres later).
- `fmtEur` / `fmtEurCompact` / `fmtBps` / `fmtDate` / `fmtBytes` / `humanizeEnum` live in `src/lib/utils.ts`.

### two-layer authorization
```
   request ─▶ middleware (src/middleware.ts)            cheap, stateless JWT read
                  gates /partner/* /client/* /admin/*
                  enforces role-prefix (PARTNER ≠ /admin)
                         │
                         ▼
              server action / server component
                  calls can(user, capability, scope)
                  src/lib/permissions.ts        ── ADMIN = god-mode
                                                ── STAFF: docs/accredit/listings,
                                                   NOT take-rate retune
                                                ── org-scoped resource owned on orgId:
                                                   a partner literally cannot see
                                                   another partner's listings
```
Auth mismatch → 307 to role home; the rule lives in `src/lib/queries.ts`, not the UI.

### pricing engine — one source of truth
`src/lib/pricing.ts` exports `computeSiteEconomics`, `computeDeploymentEconomics`, `computeCrewScenario`, `clampTakeBps`, `WHITEPAPER_REFERENCE`, `MARKET_SIZE` and `DEFAULT_PRICING`. The marketing calculator and invoice issuance import the same functions, so a client's invoice reproduces the whitepaper §3.3 economics exactly.

### polymorphic compliance documents
`Document` has `ownerType` (`PARTNER` | `CLIENT` | `LISTING`) + `ownerId` and **no** relation back to `Listing`. Reads fetch documents separately and stitch them on (see `getListing` in `src/lib/queries.ts`). Documents upload through the storage abstraction in `src/lib/storage.ts` (local FS now; swap the body for S3/R2 in prod). MIME is enforced server-side with a magic-number sniff (`hasValidMagic`) — never trust the client content-type label. `MAX_DOC_BYTES = 10 MiB`.

### consolidated multi-site invoicing
One `Invoice` rolls up every confirmed `DeploymentSite` under a deployment for a billing window. Per-site `Payout` rows (one per partner) are minted at issue time so the partner dashboard's "accrued payout" updates instantly. Paying the parent invoice flips all its payouts to `PAID` in one transaction; voiding flips pending payouts to `FAILED`. See `src/server/actions/invoices.ts`.

### vendor accreditation — the moat
A client "accredits" a partner (6–12 month approved-supplier cycle, ~9 months default) so the partner can bid on that client's deployments. The lifecycle (`NOT_STARTED → IN_REVIEW → CONDITIONAL → APPROVED → SUSPENDED`, with `REJECTED`/`PENDING` branches) is enforced in `src/server/actions/accreditation.ts` — illegal transitions are rejected with the from→to pair.

### JSON in SQLite
SQLite has no `Json` column type, so JSON fields (`roleMix`, `lineItems`, `requiredDocCategories`, audit `meta`) are serialized `String`. Always use the `jstr` / `jparse` helpers in `src/lib/utils.ts` — never inline `JSON.parse(JSON.stringify(...))`. `readRoleMix` and `readLineItems` live in `src/lib/queries.ts`.

### audit log
Every mutation logs to the append-only `AuditLog` via `logAudit` (fire-and-forget; failures swallowed). Browse the last 300 events on `/admin/audit`.

---

## ▸ verified

The build is typecheck-clean (`tsc --noEmit`), `next build` compiles all 36 routes, and a production smoke test confirms:

- [x] Public routes (`/`, `/pricing`, `/calculator`, `/how-it-works`, `/market`, `/login`, `/register`) return **200**
- [x] Protected routes (`/partner`, `/client`, `/admin`) **307-redirect** to `/login?next=...` when unauthenticated
- [x] Authenticated dashboards for all four roles return **200** with valid session tokens
- [x] Cross-role enforcement: a `PARTNER` token hitting `/admin` → 307 to `/partner`; a `STAFF` token hitting `/admin/rates` (admin-only) → 307 to `/forbidden`
- [x] The seeded invoice (`INV-COR-IBV-2100-1000`, ~€2.86M total) renders with per-site line items on `/client/invoices`
- [x] `/calculator` and `/pricing` reproduce the whitepaper economics (€7.56M gross, €983K take band, 13% default, 12–15% band, €750/site/mo, 19% VAT)
- [x] The client deployment detail page renders the economics snapshot + the add-site / status / issue-invoice action islands

---

## ▸ project structure

```
prisma/
  schema.prisma            # data model — money as cents, bps for rates, String enums
  seed.ts                  # demo orgs, users, listings, deployments, an invoice + payouts
src/
  lib/
    pricing.ts             # the economics engine (whitepaper single source of truth)
    queries.ts             # read-side queries — org-scoped, shared by dashboards & actions
    permissions.ts         # can() capability rules + roleHome()
    session.ts | auth.ts    # JWT sessions, re-fetch identity per request
    schemas.ts             # zod schemas — input validation truth
    storage.ts             # document vault upload abstraction (local FS; swap for S3/R2)
    audit.ts | db.ts | utils.ts | types.ts
  server/actions/          # "use server" mutations — auth, listings, deployments, bookings,
                           #   invoices, accreditation, docs, admin
  components/
    shell/                 # AppShell + role nav
    ui/                    # Card, Badge, Stat, Table, Field, Button, empty states
    forms.tsx              # SubmitButton + FormError for useFormState
    listing-form.tsx       # shared create/edit structured-infra spec form
  app/
    (public)               # /, /pricing, /calculator, /how-it-works, /market, /login, /register
    partner/               # supply role surface
    client/                # procurement role surface
    admin/                 # platform-ops role surface (admin + staff)
    auth/logout/route.ts   # POST logout endpoint
  middleware.ts            # JWT role-prefix gate (belt to the server-action suspenders)
scripts/
  mint-token.mjs          # dev/smoke helper — mint a session JWT for a seeded user
docs/
  banner-dark.svg  banner-light.svg   # the neon README banner (auto dark/light via <picture>)
```

---

## ▸ notes & limitations

- **SQLite** is the local-dev driver — flip `DATABASE_URL` to a Postgres URL and you're portable (the schema uses no SQLite-specific features; JSON is stored as serialized `String` deliberately).
- **Storage** is the local filesystem under `UPLOAD_DIR` (`./uploads`). Replace the body of `saveUpload` in `src/lib/storage.ts` for S3/R2; call sites don't change.
- **Payments** are modeled as invoice/payout state machines (`ISSUED → PAID`, `SCHEDULED → PAID`) but no PSP webhook is wired — `STRIPE_SECRET_KEY` is empty by design. The `markInvoicePaidAction` is the integration point.
- **bcryptjs in middleware**: `next build` warns that `bcryptjs` (imported transitively via `src/lib/auth.ts`) uses Node APIs not available in the Edge Runtime. This is non-fatal — middleware only calls `verifySession` (JWT verify via `jose`, edge-safe), never the bcrypt hashing paths. To silence it, split password hashing into a Node-only module imported solely by server actions.
- Demo password is shared across seeded users for convenience; rotate `SESSION_SECRET` and per-user passwords before any real deployment.

---

<p align="center">
  <sub><code>// one pricing engine · two-layer auth · zero paid services //</code></sub><br>
  <sub><code>Worked example verified:  600 × 9 × €1.4k  =  €7.56M gross  ─▶  ~€983K take</code></sub>
</p>
