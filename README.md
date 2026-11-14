# AcademyHub — Academy Management System

A production-ready management system engineered specifically for tuition academies, coaching centres, and evening schools in Pakistan.

One academy runs on one installation. The academy owner (admin) oversees students, teachers, classes, attendance, fees, test results, and salaries. Teachers mark attendance in under a minute and submit marks. Parents access attendance percentages, fee dues, challan PDFs, and official result cards via an isolated parent portal.

---

## Project Status

> **Current Milestone: Phase 9 Complete (Core Checkpoint)**  
> Phases 0 through 9 are fully implemented and verified. Advanced modules (Phases 10 through 14) and production deployment (Phase 15) are **NOT built yet**.

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Pre-flight & repo setup, tooling, env, DB schema, health check | **DONE** |
| **Phase 1** | Auth + roles (`ADMIN`, `TEACHER`, `PARENT`) + middleware protection | **DONE** |
| **Phase 2** | Students, teachers, classes & batches (sequential admission numbers) | **DONE** |
| **Phase 3** | Weekly timetable system with conflict prevention | **DONE** |
| **Phase 4** | Attendance marking & guardian absence notifications (deduplicated) | **DONE** |
| **Phase 5** | Fee plans, idempotent monthly invoices, append-only payments, challan PDF | **DONE** |
| **Phase 6** | Tests, draft marks, publishing lock, official result card PDFs, batch analytics | **DONE** |
| **Phase 7** | Parent portal with strict child data isolation (Invariant 5) | **DONE** |
| **Phase 8** | Admin dashboard, CSV reports, teacher payroll records & announcements | **DONE** |
| **Phase 9** | Core checkpoint: unit tests (39/39), E2E flows (8/8), security audit & documentation | **DONE** |
| **Phase 10** | Multi-branch SaaS: multi-tenancy & tenant isolation | Not built yet |
| **Phase 11** | Real payments: JazzCash + Easypaisa (sandbox + idempotent webhooks) | Not built yet |
| **Phase 12** | Online test engine: timed MCQs, auto-grading, leaderboard | Not built yet |
| **Phase 13** | AI analytics (dropout prediction, weak subjects) + test paper generator | Not built yet |
| **Phase 14** | WhatsApp Business bot + QR attendance | Not built yet |
| **Phase 15** | Final verification & production deployment (Vercel + Supabase) | Not built yet |

---

## Seed Accounts & Demo Logins

The database seed (`npm run seed`) provisions preconfigured demonstration accounts for each role:

| Role | Email | Password | Primary Access |
| :--- | :--- | :--- | :--- |
| **Admin** (Academy Owner) | `admin@academyhub.test` | `Admin123!` | `/admin` (Full administrative control) |
| **Teacher** (Faculty Lead) | `usman.teacher@academyhub.test` | `Teacher123!` | `/teacher` (Attendance & marks) |
| **Parent** (Guardian) | `parent@academyhub.test` | `Parent123!` | `/parent` (Child attendance, dues, results) |

> *Note: For production deployments (Phase 15), seed passwords must be changed immediately upon first login.*

---

## Quickstart & Local Run (Clean Clone Instructions)

Follow these exact steps to run AcademyHub locally from a fresh checkout:

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `16.x` running locally or via Docker
- **Google Chrome** or system Chromium (for Playwright E2E tests)

### 2. Clone and Setup Environment
```bash
git clone <repo-url>
cd "Academy Management System"
cp .env.example .env
```

Ensure `.env` contains your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/academyhub?schema=public"
AUTH_SECRET="change-me-to-a-secure-random-string-min-32-chars"
NEXTAUTH_SECRET="change-me-to-a-secure-random-string-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
SMS_PROVIDER="log"
SMS_API_KEY=""
```

### 3. Install Dependencies & Provision Database
```bash
# 1. Install pinned packages
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply schema migrations
npx prisma migrate dev

# 4. Seed initial academy data & test accounts
npm run seed
```

### 4. Start the Application
```bash
# Development mode:
npm run dev

# Production build & run:
npm run build
npm start
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

Health check endpoint:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```

---

## Test Suites & Quality Assurance

AcademyHub includes comprehensive automated testing covering all core business logic and critical user journeys.

### 1. Unit Tests (Vitest)
Runs 39 tests across 7 test suites verifying mathematical invariants, isolation guarantees, and edge cases:
```bash
npm test
```
- `tests/unit/money.test.ts`: Integer paisa arithmetic, rounding, discounts, tax/fines.
- `tests/unit/fees.test.ts`: Fee plan creation, discount application, fine timing, payment allocation, invoice idempotency.
- `tests/unit/attendance.test.ts`: Upsert semantics (marking twice updates the same record), duplicate-notification guard.
- `tests/unit/results.test.ts`: Percentage math, grade thresholds (A+, A, B, C, D, F), class position ranking with ties.
- `tests/unit/parent.test.ts`: Guardian isolation (Invariant 5) — parent A cannot read parent B's child data (throws 403).
- `tests/unit/teacher.test.ts`: Teacher batch isolation — teachers can only mark attendance and enter marks for assigned batches.
- `tests/unit/admin.test.ts`: Monthly collection math, defaulter calculations, CSV exports, teacher salary ledger.

### 2. End-to-End Tests (Playwright)
Executes 8 headless browser tests validating the three core workflows:
```bash
npm run test:e2e
```
- `tests/e2e/canary.spec.ts`: Health check API & login page rendering.
- `tests/e2e/auth.spec.ts`: Authentication & role-based dashboard redirection for Admin, Teacher, and Parent.
- `tests/e2e/core-flow-1.spec.ts`: **Core Lifecycle Flow 1**:
  - Admin admits student with sequential admission number (`AH-YYYY-####`).
  - Admin assigns batch enrollment with monthly fee plan.
  - Teacher marks student present on attendance roster.
  - Admin generates monthly invoices (idempotent, 0 duplicates).
  - Admin records cash fee payment.
  - Generates & downloads official 3-copy Fee Challan PDF (`%PDF-` format verified).
- `tests/e2e/core-flow-2.spec.ts`: **Core Evaluation Flow 2**:
  - Teacher creates new assessment test in DRAFT state.
  - Teacher inputs student marks into roster.
  - Admin reviews and officially publishes test results (locking marks against further edits).
  - Parent logs in and views verified test result, score, percentage, and grade.
  - Official student Result Card PDF downloaded and validated.
- `tests/e2e/core-flow-3.spec.ts`: **Parent Isolation Flow 3**:
  - Parent views own linked child's dashboard and profile.
  - Parent attempts direct URL guessing to an unlinked student profile (`/parent/child/[unlinkedId]`) → receives custom 403 Forbidden screen.
  - Parent makes direct HTTP request to `/api/parent/child/[unlinkedId]` → receives HTTP 403 Forbidden with `{ error: "Access denied: ..." }`.

---

## Core Invariants & Architecture Rules

1. **Integer Money Math (Invariant 1)**:
   - Money is **ALWAYS stored as integer minor units (paisa)**. No floating-point currencies.
   - 1 PKR = 100 paisas (e.g. PKR 4,000.00 is stored as `400000`).
   - All arithmetic strictly uses helper functions in `src/lib/money.ts`.
2. **Append-Only Payments (Invariant 2)**:
   - `FeePayment` records are strictly append-only and immutable.
   - Payments are never updated or deleted; reversing transactions must be recorded as separate compensating entries.
3. **Attendance Idempotency (Invariant 3)**:
   - Exactly one attendance record per student per day per batch (`UNIQUE(enrollmentId, date)`).
   - Marking attendance twice updates the existing record, never inserting duplicate rows.
4. **Result Cards Locked (Invariant 4)**:
   - Tests remain in `DRAFT` status while faculty enter scores.
   - Once published by an administrator, scores become read-only (`PUBLISHED`). Faculty cannot edit them; administrative modifications require an explicit audit reason stored in `correctionLog`.
5. **Guardian Privacy & Isolation (Invariant 5)**:
   - Parents can only access records belonging to their own registered children (`guardianUserId` verification).
   - Direct URL tampering (`/parent/child/[otherId]`) and unauthorized API requests are strictly blocked with `403 Forbidden`.
6. **Teacher Scope Isolation**:
   - Faculty members can only mark attendance, create tests, and enter marks for batches where they are the designated instructor.
7. **No Secrets in Repo**:
   - Secrets are loaded exclusively from `.env`. Sensitive credentials are never committed.

---

## Operational Limitations & Disclosures

### 1. SMS & WhatsApp Notifications (Simulated Log Driver)
- Real bulk SMS in Pakistan requires registering a branded alphanumeric sender ID with local telecommunication operators via an aggregator (e.g. standard telco shortcodes). WhatsApp bot integration requires an approved Meta WhatsApp Business Account.
- By default, AcademyHub runs with `SMS_PROVIDER="log"`.
- All notifications are routed through `NotificationService` (`src/lib/notify.ts`), which writes outgoing SMS payloads to `stdout` and logs them to the `NotificationLog` database table for audit purposes.
- Real SMS/WhatsApp integration is slated for **Phase 14**.

### 2. Teacher Salaries & Payroll
- The `/admin/salaries` module allows academy owners to track monthly salary disbursement status (`PAID` vs `UNPAID`) and cross-reference contracted salaries against weekly timetable hours.
- **AcademyHub does NOT execute direct bank-to-bank transfers or 1Link integration.** Disbursal occurs through external commercial banking channels or cash, and is recorded in the system for bookkeeping.

### 3. Pinned Stack & Dependency Audit
- All packages are strictly pinned to exact versions as specified in project requirements:
  - `next@14.2.5`
  - `react@18.3.1`
  - `typescript@5.5.4`
  - `tailwindcss@3.4.10`
  - `zod@3.23.8`
  - `prisma@5.18.0`
  - `next-auth@5.0.0-beta.20`
  - `pdf-lib@1.17.1`
  - `vitest@2.0.5`
  - `@playwright/test@1.46.1`
- `npm audit` reports 13 upstream advisories within these pinned packages. Running `npm audit fix --force` was intentionally bypassed because doing so would unpin required dependencies and introduce breaking API changes (e.g. Zod v4). Mitigating server-side authorization checks and validation schemas are enforced on all routes.

### 4. Hosting & Deployment
- Production deployment configuration (Vercel + Supabase) is deferred to **Phase 15**.

---

## Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/academyhub?schema=public` |
| `AUTH_SECRET` | Session encryption & JWT secret | 32+ character random hex or base64 string |
| `NEXTAUTH_SECRET` | NextAuth secret (same as `AUTH_SECRET`) | 32+ character random hex or base64 string |
| `NEXTAUTH_URL` | Canonical URL of the application | `http://localhost:3000` |
| `AUTH_TRUST_HOST` | Trust proxy headers for local Auth.js | `true` |
| `SMS_PROVIDER` | Driver for notifications (`log` or mock) | `log` |
| `SMS_API_KEY` | Vendor API key (for future phases) | `""` |
