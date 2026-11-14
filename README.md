# AcademyHub — Academy Management System

A production-ready management system engineered specifically for tuition academies, coaching centres, and evening schools in Pakistan.

One academy runs on one installation. The academy owner (admin) oversees students, teachers, classes, attendance, fees, test results, and salaries. Teachers mark attendance in under a minute and submit marks. Parents access attendance percentages, fee dues, challan PDFs, and official result cards via an isolated parent portal.

---

## Project Status

> **Current Milestone: Phase 12 Complete (Online Test Engine: Timed MCQs, Auto-Grading & Leaderboard)**  
> Phases 0 through 12 are fully implemented and verified. Advanced modules (Phases 13 through 14) and production deployment (Phase 15) are **NOT built yet**.

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
| **Phase 10** | Multi-branch SaaS: multi-tenancy, tenant isolation & SuperAdmin dashboard | **DONE** |
| **Phase 11** | Real payments: JazzCash + Easypaisa (sandbox + idempotent webhooks) | **DONE** |
| **Phase 12** | Online test engine: timed MCQs, auto-grading, leaderboard | **DONE** |
| **Phase 13** | AI analytics (dropout prediction, weak subjects) + test paper generator | Not built yet |
| **Phase 14** | WhatsApp Business bot + QR attendance | Not built yet |
| **Phase 15** | Final verification & production deployment (Vercel + Supabase) | Not built yet |

---

## Seed Accounts & Demo Logins

The database seed (`npm run seed`) provisions preconfigured demonstration accounts for each role:

| Role | Email | Password | Primary Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** (Platform Owner) | `superadmin@academyhub.test` | `SuperAdmin123!` | `/superadmin` (Cross-tenant SaaS oversight & billing) |
| **Admin** (Academy Owner) | `admin@academyhub.test` | `Admin123!` | `/admin` (Full administrative control) |
| **Teacher** (Faculty Lead) | `usman.teacher@academyhub.test` | `Teacher123!` | `/teacher` (Attendance, marks & `/teacher/marking`) |
| **Parent** (Guardian) | `parent@academyhub.test` | `Parent123!` | `/parent` (Child attendance, dues, results & online payments) |
| **Student** (Enrolled Pupil) | `student@academyhub.test` | `Student123!` | `/student` (Take timed tests, live score & leaderboard) |

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
Runs 71 tests across 10 test suites verifying mathematical invariants, multi-tenant isolation, cryptographic payment webhooks, and the online test engine:
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
- `tests/unit/multitenancy.test.ts`: Tenant data isolation, scoped admission sequences, suspended academy 403 blocking, SuperAdmin control center.
- `tests/unit/payments.test.ts`: Invariant 11 HMAC-SHA256 signature verification (JazzCash + Easypaisa), duplicate webhook idempotency guard (`FeePayment.gatewayTransactionId UNIQUE`), automated invoice status derivation (`PAID` / `PARTIAL`).
- `tests/unit/online-tests.test.ts`: Invariant 12 auto-grading math with negative marking, floor at 0, subjective SHORT question routing, leaderboard ranking with tie-breaking (score DESC, time taken ASC), single-attempt constraint (`UNIQUE(testId, studentId)`), anti-cheat tab-switch audit flag.

### 2. End-to-End Tests (Playwright)
Executes 13 headless browser tests validating the end-to-end user journeys:
```bash
npm run test:e2e
```
- `tests/e2e/canary.spec.ts`: Health check API & login page rendering.
- `tests/e2e/auth.spec.ts`: Authentication & role-based dashboard redirection for Admin, Teacher, and Parent.
- `tests/e2e/core-flow-1.spec.ts`: Core Student Lifecycle (Admission → Attendance → Fee Invoicing → Payment → Challan PDF).
- `tests/e2e/core-flow-2.spec.ts`: Core Evaluation Lifecycle (Test → Marks → Publish → Parent Result Card PDF).
- `tests/e2e/core-flow-3.spec.ts`: Parent Isolation Flow (Strict 403 blocking on unlinked student profile guessing).
- `tests/e2e/multitenancy.spec.ts`: Multi-Branch SaaS (Public signup with 14-day trial & SuperAdmin tenant controls).
- `tests/e2e/payments.spec.ts`: Real Mobile Wallet Payments (Parent initiates checkout → JazzCash sandbox wallet → automated `PAID` invoice update).
- `tests/e2e/online-tests.spec.ts`: Online Test Engine (Student logs in → takes timed assessment → auto-graded score & leaderboard; teacher manages marking queue & closes test).

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
8. **Multi-Tenant Isolation (Invariant 10)**:
   - Every tenant model carries `academyId`. All queries enforce `where: { academyId }`. Cross-tenant data leakage is strictly blocked.
9. **Cryptographic Payment Webhooks & Idempotency (Invariant 11)**:
   - Webhook callbacks from payment gateways (JazzCash / Easypaisa) **MUST verify cryptographic HMAC-SHA256 signatures server-side**. Tampered payloads or forged signatures are rejected with HTTP 400.
   - Idempotency is strictly enforced via `FeePayment.gatewayTransactionId UNIQUE` at both application and PostgreSQL engine levels: replaying identical webhook transactions records **ZERO duplicate payments** and never alters invoice balances.
10. **Online Test Integrity & Server-Side Timers (Invariant 12)**:
    - Test countdown clocks are computed and enforced strictly on the server (`startedAt` and duration in minutes). Client browser clocks are never trusted.
    - Exactly one attempt per student per test (`UNIQUE(testId, studentId)`). Second attempts are strictly blocked.
    - Question correct answers are never sent to the browser during an active assessment.
    - Negative marking auto-grades MCQs instantly with score floored at 0. Subjective SHORT answers route to `/teacher/marking`.
    - Leaderboards are sealed until faculty closes the test. Tab-switch counter audits student focus honestly without automated false accusations.

---

## Operational Limitations & Disclosures

### 1. Payment Gateways Honesty Note (Sandbox vs. Live Mode)
> [!IMPORTANT]
> **Developer Honesty Note**:
> Sandbox payments via JazzCash and Easypaisa are **100% functional end-to-end** with real HMAC-SHA256 cryptographic verification, live wallet simulation, append-only payment recording, and automated invoice status updates (`PAID` / `PARTIAL`).
> However, **LIVE payments require an approved commercial merchant account** with JazzCash (Mobilink Microfinance Bank) or Easypaisa (Telenor Microfinance Bank), requiring verified corporate NTN, commercial business bank accounts, and merchant agreement paperwork.
> Until merchant credentials are provisioned, the academy operates in **sandbox mode** and **manual collection mode** (CASH / BANK). Never claim live payments work without an approved merchant account.

### 2. SMS & WhatsApp Notifications (Simulated Log Driver)
- Real bulk SMS in Pakistan requires registering a branded alphanumeric sender ID with local telecommunication operators via an aggregator (e.g. standard telco shortcodes). WhatsApp bot integration requires an approved Meta WhatsApp Business Account.
- By default, AcademyHub runs with `SMS_PROVIDER="log"`.
- All notifications are routed through `NotificationService` (`src/lib/notify.ts`), which writes outgoing SMS payloads to `stdout` and logs them to the `NotificationLog` database table for audit purposes.
- Real SMS/WhatsApp integration is slated for **Phase 14**.

### 3. Teacher Salaries & Payroll
- The `/admin/salaries` module allows academy owners to track monthly salary disbursement status (`PAID` vs `UNPAID`) and cross-reference contracted salaries against weekly timetable hours.
- **AcademyHub does NOT execute direct bank-to-bank transfers or 1Link integration.** Disbursal occurs through external commercial banking channels or cash, and is recorded in the system for bookkeeping.

### 4. Pinned Stack & Dependency Audit
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

### 5. Hosting & Deployment
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
| `JAZZCASH_MERCHANT_ID` | JazzCash Merchant Identifier (Sandbox/Live) | `MC12345_SANDBOX` |
| `JAZZCASH_PASSWORD` | JazzCash API Password | `sandbox_password_123` |
| `JAZZCASH_INTEGRITY_SALT` | JazzCash Secret Salt for HMAC-SHA256 | `sandbox_salt_secret_9876543210` |
| `JAZZCASH_RETURN_URL` | Callback IPN / Webhook URL for JazzCash | `http://localhost:3000/api/webhooks/jazzcash` |
| `EASYPAISA_STORE_ID` | Easypaisa Merchant Store Identifier | `12345` |
| `EASYPAISA_HASH_KEY` | Easypaisa HMAC-SHA256 Secret Hash Key | `easypaisa_sandbox_hash_key_12345` |
| `EASYPAISA_RETURN_URL` | Callback IPN / Webhook URL for Easypaisa | `http://localhost:3000/api/webhooks/easypaisa` |
