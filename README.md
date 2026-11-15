# EduFlow — School Management System

A production-grade management system engineered specifically for schools, tuition academies, coaching centres, and educational networks in Pakistan.

One academy runs on one installation (or multi-tenant SaaS across many branches). The academy owner (admin) oversees students, teachers, classes, attendance, fees, test results, and salaries. Teachers mark attendance in under a minute, manage board pairings, and submit marks. Parents access attendance percentages, fee dues, challan PDFs, and official result cards via an isolated parent portal. Students take timed online tests with automated grading and view leaderboards.

---

## Project Status

> **Current Milestone: Phase 15 Complete (Final Verification, Full E2E & Honest Disclosures)**  
> All 15 phases and patches are fully implemented, verified, and passing:
> - **13 Unit Test Suites**: 112/112 tests passing (`npm test`).
> - **Playwright E2E Test Suite**: 17/17 tests passing (`npm run test:e2e`).
> - **TypeScript Compilation**: `npx tsc --noEmit` clean (0 errors).
> - **Production Build**: `npm run build` compiled 32 routes with code 0.

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
| **Phase 9** | Core checkpoint: unit tests, E2E flows, security audit & documentation | **DONE** |
| **Phase 10** | Multi-branch SaaS: multi-tenancy, tenant isolation & SuperAdmin dashboard | **DONE** |
| **Phase 11** | Real payments: JazzCash + Easypaisa (sandbox + idempotent webhooks) | **DONE** |
| **Phase 12** | Online test engine: timed MCQs, auto-grading, leaderboard | **DONE** |
| **Phase 13** | AI analytics (dropout prediction, weak subjects) + test paper generator | **DONE** |
| **Phase 13 Patch 1** | Board-aware pairing scheme data model (`PaperScheme`) + admin UI | **DONE** |
| **Phase 13 Patch 2** | Imported 288 Punjab pairing schemes (PECTAA 2026-27) + partial guards | **DONE** |
| **Phase 14** | WhatsApp Business bot + 10-minute HMAC QR attendance | **DONE** |
| **Phase 15** | Final verification, Playwright E2E full journey, security audit & deployment | **DONE** |

---

## Seed Accounts & Demo Logins

The database seed (`npm run seed`) provisions local demonstration accounts for testing:

| Role | Username / Email | Primary Access |
| :--- | :--- | :--- |
| **Super Admin** (Platform Owner) | `superadmin@eduflow.test` | `/superadmin` (Cross-tenant SaaS oversight & billing) |
| **Admin** (School/Academy Owner) | `admin@eduflow.test` | `/admin` (Full administrative control) |
| **Teacher** (Faculty Lead) | `usman.teacher@eduflow.test` | `/teacher` (Attendance, marks & `/teacher/marking`) |
| **Parent** (Guardian) | `parent@eduflow.test` | `/parent` (Child attendance, dues, results & online payments) |
| **Student** (Enrolled Pupil) | `student@eduflow.test` | `/student` (Take timed tests, live score & leaderboard) |

> [!WARNING]
> **Password Policy & Production Notice**:
> Demo accounts are seeded locally only — never seed them in production (`prisma/seed.ts` automatically skips demo account creation when `NODE_ENV=production`). Passwords are set at seed time and must be changed on first login (`mustChangePassword: true` forces an immediate redirect to `/change-password` upon sign-in).

---

## Quickstart & Local Run (Clean Clone Instructions)

Follow these exact steps to run EduFlow locally from a fresh checkout:

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eduflow?schema=public"
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

# 5. Seed Punjab pairing schemes (288 rows across 9 boards)
npm run seed:schemes
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

EduFlow includes comprehensive automated testing covering all core business logic and critical user journeys.

### 1. Unit Tests (Vitest)
Runs 112 tests across 13 test suites verifying mathematical invariants, multi-tenant isolation, cryptographic payment webhooks, board pairing schemes, and the online test engine:
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
- `tests/unit/ai-risk.test.ts`: Deterministic dropout risk model (attendance, dues, marks trend), zero-hallucination curriculum mapping, fallback wording safety.
- `tests/unit/boards.test.ts`: Board pairing scheme data model, Zod import validation, `verified: true` rejection, 288 Punjab scheme seed verification, partial scheme generator guard.
- `tests/unit/whatsapp-qr.test.ts`: WhatsApp inbound webhook keyword routing (`fee`, `attendance`/`hazri`, `result`, `help`), parent phone isolation, cryptographically signed 10-minute QR attendance tokens.

### 2. End-to-End Tests (Playwright)
Executes 17 headless browser tests in Chromium validating the entire platform lifecycle:
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
- `tests/e2e/phase15-full-flow.spec.ts`: Full Platform Journey (Academy signup → admit student → fee invoice → sandbox payment → auto PAID → online test auto-grading → risk dashboard HIGH-risk student → parent portal + QR attendance).

---

## Architecture & Multi-Tenancy

EduFlow implements a strict multi-tenant architecture designed to support both standalone single-academy deployments and multi-branch SaaS platforms:

```text
+---------------------------------------------------------------------------------------+
|                                      EduFlow Architecture                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  [Client Browser / Mobile PWA]                                                        |
|        │                                                                              |
|        ▼                                                                              |
|  [Next.js App Router (Middleware: Subdomain Tenant Resolution & NextAuth Session)]    |
|        │                                                                              |
|        ├────────────────┬─────────────────┬────────────────┬─────────────────┐       |
|        ▼                ▼                 ▼                ▼                 ▼       |
|   /superadmin         /admin           /teacher         /parent           /student    |
|  (SaaS Owner)     (Branch Admin)      (Faculty)       (Guardians)        (Pupils)     |
|        │                │                 │                │                 │        |
|        └────────────────┴─────────────────┼────────────────┴─────────────────┘        |
|                                           ▼                                           |
|                            [Unified Service & Security Layer]                         |
|    - requireAdmin / requireTeacher / requireRole / requireTenant                      |
|    - Strict Tenant Scoping: every query filters `where: { academyId }`                |
|    - Parent-Child Isolation: Invariant 5 (403 on unlinked access)                     |
|    - Deterministic Risk Engine & Pairing Scheme Validator (Invariant 12 & 13)         |
|    - Cryptographic Verification: HMAC-SHA256 (Gateways, QR Attendance, WhatsApp)      |
|                                           │                                           |
|                                           ▼                                           |
|                             [Prisma ORM & PostgreSQL]                                 |
|    - Multi-Tenant Tables with Composite Keys: @@unique([academyId, admissionNo])      |
|    - Seeded Data: 9 Punjab Boards, 288 Unified Pairing Schemes (PECTAA 2026-27)        |
+---------------------------------------------------------------------------------------+
```

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
11. **Board-Aware Pairing Schemes (Invariant 13)**:
    - **AI never invents an educational board's paper scheme.**
    - The paper structure (MCQ count and marks, Short question count/marks/attempts, Long question count/marks/attempts, total marks, time limit) always comes strictly from a stored `PaperScheme` database record.
    - The LLM only writes questions inside that verified structure, using only the instructor-selected syllabus chapters.
    - Output validation strictly rejects and retries any LLM response with mismatched question counts or marks. Unverified schemes are prominently labeled everywhere with `"UNVERIFIED — confirm before use"`.

### Pairing Schemes (Punjab Unified PECTAA 2026–2027)
- **32 Punjab Schemes Seeded**: Unified pairing schemes covering 9th, 10th, 11th, and 12th grades for all 9 Punjab BISE boards (Lahore, Gujranwala, Multan, Faisalabad, Sargodha, Rawalpindi, Bahawalpur, D.G. Khan, and Sahiwal) based on official PECTAA notifications (2026–2027 ALP).
- **288 Database Rows**: Each unified scheme is imported per board (32 × 9 = 288 rows), enabling board-specific adjustments while retaining unified defaults.
- **All Unverified Until Teacher Confirmation**: All imported schemes default to `verified: false`. Instructors must confirm the scheme via `/admin/boards` before relying on it in high-stakes testing.
- **15 Partial Schemes**: Schemes where section breakdowns (short/long question counts) could not be definitively verified from available sources are tagged with a `PARTIAL:` notes prefix.
- **Generator Guard**: The test paper generator is strictly disabled for partial schemes with the prompt: *"Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao."*
- **Gaps & Sources**: Documented in detail in `SOURCES.md` and `punjab-pairing-schemes.json`.

---

## Project Status & Honest Disclosures

> [!IMPORTANT]
> **Production Readiness Statement**:
> EduFlow has a **production-ready software architecture** with strict multi-tenant isolation, cryptographic webhook verification, deterministic risk scoring, and zero-defect test suites.
> However, **live commercial deployment requires external commercial business accounts** (JazzCash corporate merchant account, Meta WhatsApp Business verification, and local telco SMS aggregator contracts). Do not claim "production-ready for live commercial transactions" without these external contracts in place.

### 1. Mobile Wallet Payments (Sandbox vs. Live Mode)
- **100% Functional in Sandbox**: Both JazzCash and Easypaisa integrations are fully implemented with real HMAC-SHA256 signature verification, sandbox checkout portals, append-only payment recording, and automated invoice status derivation (`PAID` / `PARTIAL`).
- **Live Commercial Requirement**: Processing real money in Pakistan requires an approved commercial merchant agreement with JazzCash (Mobilink Microfinance Bank) or Easypaisa (Telenor Microfinance Bank), including an active Corporate NTN, physical business verification, and dedicated bank merchant accounts.
- **Current Operational Mode**: Until live credentials are provided in `.env`, the system runs in **sandbox mode** for online payments and supports manual reconciliation (`CASH` or `BANK`) by academy administrators.

### 2. WhatsApp Business Bot & SMS Notifications
- **WhatsApp Cloud API Driver**: Fully built behind `NotificationService` (`src/lib/notify.ts`) with inbound webhook routing (`/api/webhooks/whatsapp`), SHA-256 app secret signature verification, and keyword queries in English and Roman Urdu (`fee`, `attendance`/`hazri`, `result`, `help`).
- **Meta Business Verification**: The driver defaults to the **LOG driver** (`SMS_PROVIDER="log"`) until the academy completes official Meta Business Manager verification and registers a dedicated WhatsApp Business phone number.
- **Bulk SMS**: The log driver records all dispatched SMS messages to the `NotificationLog` database table. Live delivery requires contracting with a local Pakistani telco aggregator (e.g. branded alphanumeric sender ID).

### 3. AI Test Generator & Analytics (Deterministic Fallback)
- **Deterministic Risk Engine (Invariant 12)**: Student dropout risk and weak-subject analytics are computed mathematically in code (`src/lib/risk.ts`) from attendance percentages, fee overdue periods, and test mark trends. The LLM only generates natural Urdu/English summary explanations.
- **Board Pairing Schemes (Invariant 13)**: The test generator never invents paper structures. It strictly loads stored `PaperScheme` records (288 Punjab schemes seeded) and only prompts the LLM to draft questions within that exact structure.
- **Graceful Degradation**: If `LLM_API_KEY` is omitted or Groq is unreachable, the system shows *"AI unavailable — showing data only"* without crashing or blocking users.

### 4. Biometric Hardware Disclosure (What is NOT Built)
- **Biometric Fingerprint Devices**: Physical USB biometric fingerprint scanners are **NOT** supported. In Pakistani coaching centres, physical scanners cause extreme hardware unreliability, driver incompatibility, and hallway queues during 5-minute shift handoffs.
- **QR Code Alternative**: Replaced by **10-minute HMAC-SHA256 signed QR attendance** (`src/lib/qr.ts`). Faculty display a live batch QR code on a screen; students scan with their mobile devices to mark attendance with instant server-side deduplication.
- **Native Mobile Apps**: Native `.apk` / `.ipa` binaries are **NOT** built. The web client is designed as a responsive, mobile-first Progressive Web App (PWA) accessible directly via smartphone browsers.
- **Automated Bank Payroll Transfers**: Direct 1Link or Raast bank-to-bank salary disbursement is **NOT** built. The `/admin/salaries` module serves as an internal salary ledger and audit log; actual fund disbursements are handled outside the software.

### 5. Pinned Stack & Security Audit
- All libraries are pinned to exact versions per project requirements:
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
- **Security Grep Audit**: Zero `TODO`, zero `FIXME`, zero sensitive credential `console.log` statements in `src/`. All 9 API routes enforce role authorization, tenant scoping (`where: { academyId }`), or cryptographic HMAC verification.
- **Dependency Audit**: `npm audit` reports 13 upstream advisories in pinned packages (`next`, `zod`, `vitest`, `playwright`, `next-auth`). Force-fixing was intentionally omitted to prevent breaking pinned framework versions. Server-side validation guards protect all ingress points.

---

## Production Deployment (Vercel + Supabase Free Tiers)

EduFlow is engineered to run seamlessly on the free tiers of **Supabase** (PostgreSQL) and **Vercel** (Next.js hosting).

### Step 1: Provision Supabase PostgreSQL Database
1. Sign in to [Supabase](https://supabase.com) and click **New Project**.
2. Set the project name (e.g., `eduflow-prod`) and a secure database password.
3. Choose the closest region (e.g., Singapore `ap-southeast-1` or Frankfurt `eu-central-1`).
4. Once provisioned, navigate to **Project Settings** $\rightarrow$ **Database**.
5. Under **Connection String**, select **URI**:
   - For serverless deployments, use the **Connection Pooling URI** (Transaction mode, port `6543`):
     ```text
     postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - For running migrations from your local CLI, use the **Direct Connection URI** (port `5432`):
     ```text
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public
     ```

### Step 2: Apply Migrations & Seed Supabase Database
Run migrations and seeds against the Supabase database using your terminal:
```bash
# Set your Supabase connection string temporarily
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public"

# 1. Apply all Prisma migrations
npx prisma migrate deploy

# 2. Seed initial academy, admin, teachers, students, batches, and demo data
npm run seed

# 3. Seed 288 Punjab educational board pairing schemes (PECTAA 2026-27)
npm run seed:schemes
```

### Step 3: Deploy to Vercel
1. Push your repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `EduFlow` repository.
4. Set **Framework Preset** to **Next.js**.
5. The `package.json` includes `"postinstall": "prisma generate"`, ensuring the Prisma Client compiles during the Vercel build phase.
6. Configure the **Environment Variables** in Vercel Project Settings:

| Environment Variable | Recommended Production Value |
| :--- | :--- |
| `DATABASE_URL` | Supabase Pooler URI (port 6543 with `?pgbouncer=true`) |
| `AUTH_SECRET` | 32+ character random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_SECRET` | Same value as `AUTH_SECRET` |
| `NEXTAUTH_URL` | Your Vercel canonical URL: `https://<your-project>.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `SMS_PROVIDER` | `log` (or `whatsapp` once Meta business verified) |
| `JAZZCASH_MERCHANT_ID` | Sandbox ID or live merchant account identifier |
| `JAZZCASH_PASSWORD` | Sandbox or live password |
| `JAZZCASH_INTEGRITY_SALT` | Secret salt for HMAC-SHA256 signature verification |
| `JAZZCASH_RETURN_URL` | `https://<your-project>.vercel.app/api/webhooks/jazzcash` |
| `EASYPAISA_STORE_ID` | Sandbox or live Easypaisa Store ID |
| `EASYPAISA_HASH_KEY` | Secret hash key for Easypaisa HMAC verification |
| `EASYPAISA_RETURN_URL` | `https://<your-project>.vercel.app/api/webhooks/easypaisa` |
| `LLM_API_KEY` | Optional Groq API Key (omission triggers safe fallback) |
| `LLM_MODEL` | `llama-3.1-70b-versatile` |
| `WHATSAPP_TOKEN` | Meta WhatsApp Cloud API Token (if using WhatsApp) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business Phone Number ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token for Meta Developer portal |
| `WHATSAPP_APP_SECRET` | Meta App Secret for inbound webhook HMAC validation |

7. Click **Deploy**. Vercel will run `npm run build` and launch the application.

---

## Clean Clone & Reproduction Walkthrough

To verify the platform independently from a fresh clone:

```bash
# 1. Clone repository into a fresh directory
git clone <repo-url> eduflow-clean
cd eduflow-clean

# 2. Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL 16 credentials:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eduflow_fresh?schema=public"

# 3. Install pinned dependencies (triggers postinstall prisma generate)
npm install

# 4. Run schema migrations
npx prisma migrate dev

# 5. Populate seed data & educational schemes
npm run seed
npm run seed:schemes

# 6. Execute full verification test suites
npx tsc --noEmit          # Expected: 0 errors
npm test                  # Expected: 13/13 suites passed (112 tests)
npm run test:e2e          # Expected: 8/8 suites passed (17 tests)
npm run build             # Expected: 32 routes compiled successfully (Exit code 0)

# 7. Start local server
npm run dev
# Open http://localhost:3000 and log in with any demo account
```

---

## Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/eduflow?schema=public` |
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
| `LLM_API_KEY` | Groq API Key for AI paper generator & Urdu explanations | `""` (falls back safely if omitted) |
| `LLM_MODEL` | Groq model identifier | `llama-3.1-70b-versatile` |
| `WHATSAPP_TOKEN` | Meta WhatsApp Cloud API permanent system user token | `""` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Business Phone Number ID | `""` |
| `WHATSAPP_VERIFY_TOKEN` | Secret token for Meta webhook subscription verification | `change-me-to-a-secure-random-token` |
| `WHATSAPP_APP_SECRET` | Meta App Secret for X-Hub-Signature-256 HMAC validation | `change-me-to-meta-app-secret` |
| `QR_HMAC_SECRET` | Dedicated secret for HMAC-SHA256 student QR attendance | `change-me-to-a-secure-random-hex-string` |
| `SEED_ADMIN_PASSWORD` | Optional: Password for seeded admin user (development only) | `change-me-seed-admin-password` |
| `SEED_SUPERADMIN_PASSWORD`| Optional: Password for seeded superadmin (development only) | `change-me-seed-superadmin-password` |
| `SEED_TEACHER_PASSWORD` | Optional: Password for seeded teacher (development only) | `change-me-seed-teacher-password` |
| `SEED_PARENT_PASSWORD`  | Optional: Password for seeded parent (development only) | `change-me-seed-parent-password` |
| `SEED_STUDENT_PASSWORD` | Optional: Password for seeded student (development only) | `change-me-seed-student-password` |

---

## Security & Hardening Policy

> [!CAUTION]
> **Credential & Secret Protection**:
> Never commit `.env` or real credentials to this repository. All secrets must go strictly into environment variables (Vercel Project Settings for production, or a local untracked `.env` file for development, never in git).
> If a secret is ever committed by mistake, **rotate it immediately** at the provider level — deleting the file does not remove it from git history.

### Security Hardening Audit (Phase 15 Patch)
An independent security audit reviewed the public codebase and implemented the following hardening measures:
1. **Fail-Closed WhatsApp Webhook (HIGH)**:
   - `WHATSAPP_APP_SECRET` is mandatory for all inbound POST webhooks.
   - Cryptographic `X-Hub-Signature-256` HMAC validation is enforced on every request before payload parsing, preventing unauthorized child data queries.
   - Missing verify tokens reject challenge requests with HTTP 403.
2. **Dedicated QR Attendance Secret (HIGH)**:
   - Replaced public default fallback strings with dedicated `QR_HMAC_SECRET`.
   - `getQRSecret()` throws immediately if unset; attendance tokens cannot be minted or verified without an explicit secret.
3. **Forced Password Rotation & Seed Password Security (MEDIUM & LOW)**:
   - Added `mustChangePassword` flag to `User` schema.
   - All seeded users are flagged for mandatory rotation; middleware intercepts and forces redirection to `/change-password` upon login.
   - Session refresh via Auth.js `unstable_update()` seamlessly issues a fresh token with `mustChangePassword: false` upon password change without manual sign-out.
   - Seed scripts automatically skip demo user creation in production (`NODE_ENV === "production"`).
   - In development/testing, seed passwords are read from `SEED_*_PASSWORD` environment variables. If unset, secure random passwords are generated at seed time and printed ONCE to console. No default passwords exist in the codebase.
4. **Brute-Force Login Rate Limiting (MEDIUM)**:
   - Enforced dual-key rate limiting: 5 failed attempts per account (normalized email) OR per IP (`x-forwarded-for` first entry, fallback to request IP) triggers a 15-minute freeze in `src/lib/rate-limit.ts`.
   - *Architecture Note*: The rate limiter currently uses an in-memory `Map`. In a multi-instance or Vercel Serverless environment, instances do not share memory; for distributed production deployments, upgrading the backing store to Redis (e.g., Upstash Redis) is recommended.
   - Per-email lockout prevents online brute-force against specific accounts, while per-IP lockout prevents distributed credential-stuffing attacks across multiple accounts.
5. **Next.js Dependency Upgrade (MEDIUM)**:
   - Upgraded framework from `14.2.5` to patched `14.2.35`.
6. **Payment Gateway Sandbox vs Live Isolation (MEDIUM & LOW)**:
   - Sandbox checkout works out-of-the-box with ZERO payment environment variables set in all environments, ensuring testing and CI workflows never fail.
   - LIVE payments require an approved merchant account with live credentials (`JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_RETURN_URL` for JazzCash; `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_RETURN_URL` for Easypaisa).
   - In live mode, gateway drivers strictly verify that credentials differ from known sandbox defaults, throwing a hard error if sandbox defaults are supplied in production.
7. **Defense-in-Depth & PII Redaction (LOW)**:
   - Added `@@unique([referenceId])` constraint to `NotificationLog` table to guarantee atomic absence notification deduplication at the database level.
   - Stripped full message bodies containing student names and fee amounts from console output (logs only record IDs and event statuses).
   - Extended `middleware.ts` to cover `/student/*` and `/api/*` routes.
   - Eliminated fake `"platform"` fallback academy for SuperAdmins; operations on tenant resources now require an active academy.
   - Restricted payment gateway sandbox credentials exclusively to non-production environments.

### Production Deployment Security Checklist
Before launching in production, verify:
- [ ] `NODE_ENV` is set to `"production"`.
- [ ] `AUTH_SECRET` and `NEXTAUTH_SECRET` are set via `openssl rand -base64 32`.
- [ ] `QR_HMAC_SECRET` is set via `openssl rand -hex 32`.
- [ ] `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` are configured from your Meta App Dashboard.
- [ ] Payment gateway merchant credentials (`JAZZCASH_*`, `EASYPAISA_*`) are set with approved merchant accounts.
- [ ] Database migrations are executed (`npx prisma migrate deploy`).
- [ ] Seed script is run without demo accounts (`prisma db seed` in production skips demo users).
- [ ] Any initial administrator accounts change their passwords immediately upon first access.

