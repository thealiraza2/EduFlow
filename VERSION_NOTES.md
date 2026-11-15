# Version Notes & Pinned Dependencies

All core dependencies are strictly pinned to the versions specified in the Master Prompt.

| Package | Pinned Target | Installed Version | Status |
| :--- | :--- | :--- | :--- |
| `next` | `14.2.5` | `14.2.5` | Pinned exact |
| `react` | `18.3.1` | `18.3.1` | Pinned exact |
| `react-dom` | `18.3.1` | `18.3.1` | Pinned exact |
| `typescript` | `5.5.4` | `5.5.4` | Pinned exact |
| `tailwindcss` | `3.4.10` | `3.4.10` | Pinned exact |
| `zod` | `3.23.8` | `3.23.8` | Pinned exact |
| `prisma` | `5.18.0` | `5.18.0` | Pinned exact |
| `@prisma/client` | `5.18.0` | `5.18.0` | Pinned exact |
| `pdf-lib` | `1.17.1` | `1.17.1` | Pinned exact |
| `vitest` | `2.0.5` | `2.0.5` | Pinned exact |
| `@playwright/test` | `1.46.1` | `1.46.1` | Pinned exact |
| `next-auth` | `5.0.0-beta.20` | `5.0.0-beta.20` | Pinned exact |
| `bcryptjs` | `2.4.3` | `2.4.3` | Pure JS bcrypt for password hashing |
| `PostgreSQL` | `16` | `16.16.0` | PostgreSQL 16 Binaries |

## Phase 9 Security Audit & npm audit Assessment

Running `npm audit` flags 13 dependency advisories originating in pinned packages (`next@14.2.5`, `next-auth@5.0.0-beta.20`, `zod@3.23.8`, `vitest@2.0.5`, `@playwright/test@1.46.1`).

**Why `npm audit fix --force` was NOT executed:**
1. **Explicit Pinned Stack Mandate**: The project constraints explicitly mandate pinned versions (`next@14.2.5`, `zod@3.23.8`, `next-auth@5.0.0-beta.20`).
2. **Breaking Changes**: Running `npm audit fix --force` attempts to upgrade to `zod@4.x` (which introduces breaking API changes throughout the codebase) and unpins Next.js and Auth.js.
3. **Compensating Controls**:
   - EduFlow is an invite-only internal school/academy management system (no public registration).
   - Strict server-side Zod input validation guards all endpoints against oversized payloads.
   - All server actions and API routes enforce session authentication and role/tenant authorization checks.
