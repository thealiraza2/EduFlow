# AcademyHub — Academy Management System

A complete, robust management system engineered for tuition academies and coaching centres in Pakistan.

One academy runs on one installation. The academy owner (admin) manages students, teachers, classes, attendance, fees, and test results. Teachers mark attendance and enter marks. Parents access attendance, fee dues, and results on a dedicated parent portal.

---

## Project Status

> **Current Milestone: Phase 8 Complete**  
> All subsequent phases (9 through 15) are **NOT built yet**.

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Pre-flight & repo setup, tooling, env, DB schema, health check | **DONE** |
| **Phase 1** | Auth + roles (Admin, Teacher, Parent) + middleware protection | **DONE** |
| **Phase 2** | Students, teachers, classes & batches | **DONE** |
| **Phase 3** | Timetable management | **DONE** |
| **Phase 4** | Attendance + parent absence notifications | **DONE** |
| **Phase 5** | Fees: plans, monthly invoices, append-only payments, challans | **DONE** |
| **Phase 6** | Tests, marks, result cards & publishing | **DONE** |
| **Phase 7** | Parent portal (strict child data isolation) | **DONE** |
| **Phase 8** | Admin dashboard, reports & teacher salaries | **DONE** |
| **Phase 9** | Core checkpoint: unit + e2e tests & security audit | Not built yet |
| **Phase 10** | Multi-branch SaaS: multi-tenancy & tenant isolation | Not built yet |
| **Phase 11** | Real payments: JazzCash + Easypaisa (sandbox + idempotent webhooks) | Not built yet |
| **Phase 12** | Online test engine: timed MCQs, auto-grading, leaderboard | Not built yet |
| **Phase 13** | AI analytics (dropout prediction, weak subjects) + test paper generator | Not built yet |
| **Phase 14** | WhatsApp Business bot + QR attendance | Not built yet |
| **Phase 15** | Final verification & deployment (Vercel + Supabase) | Not built yet |

---

## Important Notice on SMS / WhatsApp Notifications

Real SMS in Pakistan requires a registered bulk SMS gateway with paid SMS credits (e.g. standard telco shortcodes/brand names). WhatsApp integration requires a verified Meta WhatsApp Business Account.

In this codebase:
- All notifications go through a provider-agnostic `NotificationService` interface.
- By default, the **LOG driver** is active (`SMS_PROVIDER=log`), which records notifications to the console and audit logs.
- **SMS is log-only until a real gateway is configured via environment variables.**
- We never claim SMS "works" when only the log driver has run.

---

## Notice on Teacher Salaries & Payroll Accounting

> **Operational Accounting Notice**: Teacher salaries are marked as PAID inside AcademyHub for internal record-keeping; actual bank transfers occur outside the system.

---

## Core Invariants

1. **Money Math**: Money is **ALWAYS integer minor units (paisa)**. No floating-point numbers anywhere. 1 PKR = 100 paisas. All calculations strictly reside in `src/lib/money.ts`.
2. **Append-Only Fees**: Fee payments are immutable and append-only. No payment record can ever be modified or deleted. Adjustments are recorded as new compensating transactions.
3. **Attendance**: Exactly one attendance record per student per day per batch. Upsert semantics prevent duplicate records.
4. **Result Cards Locked**: Marks become read-only once published; corrections require administrative audit logging.
5. **Parent Isolation**: Parents can only access records belonging to their own children (`guardianUserId` verification). Any unauthorized direct access returns `403 Forbidden`.
6. **Teacher Isolation**: Teachers can only access and update batches assigned directly to them.
7. **No Secrets in Repo**: Environment variables and keys are never committed; `.env` is gitignored.

---

## Tech Stack (Pinned Versions)

- **Framework**: Next.js 14.2.5 (App Router), React 18.3.1, TypeScript 5.5.4
- **Styling**: Tailwind CSS 3.4.10 + shadcn/ui
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.18.0
- **Authentication**: Auth.js (NextAuth v5 beta.20)
- **Validation**: Zod 3.23.8
- **PDF Generation**: pdf-lib 1.17.1
- **Testing**: Vitest 2.0.5, Playwright 1.46.1

---

## Setup & Local Development

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL 16 (Local, Docker, or Supabase)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL 16 instance.

### 3. Installation & Database Sync
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

Health check endpoint:
```bash
curl http://localhost:3000/api/health
```
Response: `{"status":"ok"}`

---

## Modules Implemented (Phases 1–8)

### Phase 1: Authentication & Authorization
- Auth.js v5 with credentials provider, JWT sessions, bcryptjs.
- Roles: `ADMIN`, `TEACHER`, `PARENT`.
- Middleware protection on `/admin/*`, `/teacher/*`, `/parent/*`. Server-side guards in `src/lib/permissions.ts`.

### Phase 2: Students, Faculty, Classes & Batches
- Sequential non-reusable student admission numbers (`AH-YYYY-####`).
- Atomic transactions for teacher accounts and guardian accounts.
- Batch scheduling, enrollment rules, and status lifecycle (`ACTIVE`, `LEFT`, `STRUCK_OFF`).

### Phase 3: Weekly Timetable System
- Mon–Sat schedule grid with double-booking prevention for batches and teachers.
- Teacher personal timetable and parent read-only timetable views.

### Phase 4: Attendance & Absence Notifications
- Rapid attendance marking with upsert semantics and 7-day teacher edit window.
- Guardian absence alerts queued with strict once-per-day duplicate prevention.
- Admin attendance analytics flagging students below 75% attendance.

### Phase 5: Fees, Invoices, Payments & Challan PDFs
- Idempotent monthly invoice generation (`generateMonthlyInvoices(month)`).
- Append-only payment ledger with auto-derived payment status (`UNPAID`, `PARTIAL`, `PAID`).
- High-fidelity 3-copy A4 fee challan PDF generation (Bank, Academy, Student copies).
- Defaulters dashboard with 1-tap SMS fee reminder.

### Phase 6: Tests, Marks, Result Cards & Publishing
- Teacher test creation and student marks entry in DRAFT state.
- Admin publishing workflow locking marks from modifications.
- Official A4 Result Card PDF with letter grading, percentage, and faculty remarks.
- Batch analytics, toppers list, and subject difficulty diagnostics.

### Phase 7: Parent Portal
- Strict guardian isolation (Invariant 5) enforced at service layer and HTTP routes (403 Forbidden).
- Overview of linked children, attendance summaries, fee payment ledger, downloadable challans, and published test cards.
- Historical log of SMS messages and absence alerts.

### Phase 8: Admin Dashboard, Reports & Teacher Salaries
- **Admin Control Center (`/admin`)**:
  - Live monthly fee collection KPI (collected vs due).
  - Defaulters counter.
  - Today's academy attendance percentage.
  - Active roster metrics (students, batches, faculty).
  - Low-attendance watchlist (<75% attendance rate).
  - Upcoming evaluation tests and status tracker.
- **CSV Reports Engine (`/admin/reports` & `/api/admin/reports`)**:
  - 1. Monthly fee collection report (all line items, discounts, late fines, paid amounts, remaining balances).
  - 2. Batch attendance report (total sessions, present, absent, leave, late, attendance %).
  - 3. Student academic performance report (test marks, percentage, grade, remarks).
  - 4. Teacher workload & payroll report (base contracts, assigned batches, weekly lecture slots, estimated weekly hours).
- **Teacher Salaries & Payroll Ledger (`/admin/salaries`)**:
  - Contract base salary in minor units (paisa).
  - Monthly disbursement tracking (`PAID` vs `UNPAID`).
  - Workload metrics derived from timetable slots.
  - Prominent operational notice that bank transfers take place outside the system.
- **Academy Announcements**:
  - Admin announcement composer with audience targeting (`ALL`, `TEACHERS`, `PARENTS`).
  - Broadcast notification logging via `NotificationService`.
  - Targeted notices banner on Teacher and Parent dashboards.
