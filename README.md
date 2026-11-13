# AcademyHub — Academy Management System

A complete, robust management system engineered for tuition academies and coaching centres in Pakistan.

One academy runs on one installation. The academy owner (admin) manages students, teachers, classes, attendance, fees, and test results. Teachers mark attendance and enter marks. Parents access attendance, fee dues, and results on a dedicated parent portal.

---

## Project Status

> **Current Milestone: Phase 0 Complete**  
> All subsequent phases (1 through 15) are **NOT built yet**.

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Pre-flight & repo setup, tooling, env, DB schema, health check | **DONE** |
| **Phase 1** | Auth + roles (Admin, Teacher, Parent) + middleware protection | **DONE** |
| **Phase 2** | Students, teachers, classes & batches | Not built yet |
| **Phase 3** | Timetable management | Not built yet |
| **Phase 4** | Attendance + parent absence notifications | Not built yet |
| **Phase 5** | Fees: plans, monthly invoices, append-only payments, challans | Not built yet |
| **Phase 6** | Tests, marks, result cards & publishing | Not built yet |
| **Phase 7** | Parent portal (strict child data isolation) | Not built yet |
| **Phase 8** | Admin dashboard, reports & teacher salaries | Not built yet |
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

## Core Invariants

1. **Money Math**: Money is **ALWAYS integer minor units (paisa)**. No floating-point numbers anywhere. 1 PKR = 100 paisas. All calculations strictly reside in `src/lib/money.ts`.
2. **Append-Only Fees**: Fee payments are immutable and append-only. No payment record can ever be modified or deleted. Adjustments are recorded as new compensating transactions.
3. **Attendance**: Exactly one attendance record per student per day per batch.
4. **Parent Isolation**: Parents can only access records belonging to their own children (`guardianUserId` verification). Any unauthorized access returns `403 Forbidden`.
5. **Teacher Isolation**: Teachers can only access and update batches assigned directly to them.
6. **No Secrets in Repo**: Environment variables and keys are never committed; `.env` is gitignored.

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
npx prisma db push
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

## Authentication & Authorization (Phase 1)

- **Engine**: Auth.js (NextAuth v5 beta.20) with JWT session strategy and bcryptjs password hashing.
- **Roles**: `ADMIN`, `TEACHER`, `PARENT`.
- **Registration**: Strictly closed; academy accounts are created exclusively by the academy administrator.
- **Route Protection (`src/middleware.ts`)**:
  - `/admin/*`: Restricted strictly to `ADMIN` role. Unauthenticated requests are redirected to `/login?callbackUrl=...`; non-admin authenticated users are blocked with HTTP `403 Forbidden`.
  - `/teacher/*`: Accessible to `TEACHER` and `ADMIN` (directors oversee all batches).
  - Unauthenticated access to protected routes redirects to `/login`.
- **Permissions Layer (`src/lib/permissions.ts`)**: Server-side guards `requireAdmin()`, `requireTeacher()`, and `requireParent()` enforce security at the server actions and API levels.
- **Default Seed Accounts**:
  - Admin: `admin@academyhub.test` / `Admin123!`
  - Parent (verification): `parent@academyhub.test` / `Parent123!`

