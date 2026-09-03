# AI Agent Guidelines — Stride

> **Audience:** AI Coding Assistants (Antigravity, Claude, Codex, Cursor, Copilot) & Human Contributors  
> **Repository:** `XBoT95/Stride`

This document defines mandatory guidelines, architecture boundaries, and workflow discipline for any AI agent working on Stride.

---

## 1. Project Overview & Core Philosophy

Stride is an AI-powered goal execution platform built on Next.js 16.3.0 App Router, Supabase PostgreSQL, and Google Gemini 3.6 Flash (`@google/genai`).

### Core Engineering Philosophy
- **Zero-Bloat Rule**: *"If something works clearly in 10 lines of code, do not introduce an 11th line unless that additional complexity provides a concrete benefit such as correctness, security, performance, maintainability, optimization, or a required feature."*
- **No Unnecessary State Managers**: Do NOT introduce Zustand, TanStack Query (React Query), Redux, Framer Motion, or background worker libraries. Use native Next.js Server Components and Server Actions.
- **Audit-First Rule**: ALWAYS inspect existing codebase, database schemas, services, and documentation before modifying or creating files.

---

## 2. Repository Structure

```text
Stride/
├── AGENTS.md                  # Repository-wide instructions (This File)
├── CHANGELOG.md               # Reverse-chronological project history & release log
├── README.md                  # Public project documentation & setup
├── app/                       # Next.js 16.3.0 application root
│   ├── AGENTS.md              # Next.js framework-generated agent rules (DO NOT REMOVE)
│   ├── package.json           # Dependencies
│   └── src/
│       ├── app/               # Next.js App Router pages & Server Actions (goals/actions.ts)
│       ├── components/        # Presentation UI components (goals/, layout/, tasks/)
│       ├── lib/               # Utility modules & Supabase client factories
│       ├── services/          # Business Logic Layer (auth, goal, roadmap, task services)
│       └── types/             # Domain DTO & entity interfaces
├── database/                  # Database architecture
│   ├── migrations/            # Timestamped PostgreSQL migration scripts
│   └── schemas/               # Baseline table schemas (00-05)
└── docs/                      # Core System Documentation
```

---

## 3. Architecture Boundaries

Stride enforces strict unidirectional layer isolation:

```text
Presentation UI Component / Page
        │
        ▼
Server Action (app/src/app/*/actions.ts)
        │
        ▼
Domain Service (app/src/services/*.service.ts)
        │
        ▼
Supabase PostgreSQL / Gemini API
```

- **UI Components** MUST NOT query Supabase directly or call external AI APIs.
- **Pages & Components** call Server Actions for mutations and Domain Services for data fetching.
- **Services** encapsulate all database queries, RPC invocations, and AI prompt interactions.

---

## 4. Where Business Logic Belongs

- All business logic MUST live inside **`app/src/services/`**:
  - `auth.service.ts`: Authentication, session retrieval, profile sync.
  - `goal.service.ts`: Goal persistence via RPC, goal detail fetching, cascading goal deletion.
  - `roadmap.service.ts`: Gemini 3.6 Flash prompt execution and Zod roadmap validation.
  - `task.service.ts`: Today task retrieval, deterministic task sorting, and RPC task toggling.
- Pages, Server Actions, and Client Components MUST remain thin wrappers.

---

## 5. Server Component / Client Component Conventions

- **Default to React Server Components (RSC)**: All `page.tsx` files, headers (`UserNav`), and tree visualizations (`RoadmapTree`, `TaskList`) MUST be Server Components.
- **Use Client Components (`"use client"`) ONLY when necessary**:
  - Interactive forms (`CreateGoalForm` using `useActionState`).
  - Interactive checkboxes/buttons (`TaskItem` using `useTransition`).
  - Modal dialogs (`DeleteGoalDangerZone` using `useState` & keyboard listeners).

---

## 6. Server Action Conventions

- Located in `actions.ts` files marked `'use server'`.
- Accept pure form data or primitive argument types (e.g. `taskId: string`, `goalId: string`).
- Perform server-side input validation before calling services. Never use unsafe `as string` casts without validation.
- Call `revalidatePath('/', 'layout')` on mutations to purge layout caches cleanly.
- Return normalized user-facing errors `{ error: string | null }`.

---

## 7. Service-Layer Conventions

- Wrap database and external API calls in `try / catch` blocks.
- Map raw PostgreSQL snake_case database rows (`RawTaskRow`, `RawGoalRow`) to camelCase domain types (`Task`, `Goal`, `Milestone`).
- Return normalized result interfaces `{ data/result, error: string | null }`.

---

## 8. Database Migration Rules

- **Never modify historical migrations** (`20260815_security_hardening.sql`, `20260820_atomic_goal_creation.sql`, `20260821_rls_perf_and_fk_indexes.sql`).
- Schema modifications require a new timestamped migration file in `database/migrations/YYYYMMDD_feature.sql`.
- Update `docs/database_schema.md` in tandem with database changes.
- Never execute destructive SQL or drop tables unless explicitly instructed.

---

## 9. Supabase / RLS Security Rules

- **Row Level Security (RLS)** is enabled on 100% of tables and MUST NOT be bypassed.
- RLS policies use scalar subqueries: `(select auth.uid()) = user_id`.
- Stored procedures MUST use `SECURITY INVOKER` and `SET search_path = ''`.
- Stored procedure privileges MUST be restricted: `REVOKE EXECUTE FROM PUBLIC, anon; GRANT EXECUTE TO authenticated;`.

---

## 10. AI / Gemini Safety & Validation Rules

- `GEMINI_API_KEY` is server-only (`process.env.GEMINI_API_KEY`). NEVER prefix with `NEXT_PUBLIC_` or expose to client code/logs.
- AI output MUST be generated using Gemini 3.6 Flash (`gemini-3.6-flash`) with `responseMimeType: "application/json"`.
- AI responses MUST be validated using `RoadmapSchema` (Zod). Never trust raw unvalidated AI output.

---

## 11. Error-Handling Expectations

- Direct database tracebacks and provider errors MUST NOT be exposed to the client.
- Follow `docs/error-philosophy.md` for normalized user-facing messages (e.g., *"We couldn't save your goal right now. Please try again."*).

---

## 12. Testing & Validation Expectations

After making any code changes, run verification in `/app`:
```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
All three commands MUST pass cleanly with exit code 0 before completing a task.

---

## 13. Documentation Maintenance

- When system architecture or component interfaces change, update `docs/system-architecture.md` and `README.md`.
- When database schemas or RPCs change, update `docs/database_schema.md`.

---

## 14. CHANGELOG Maintenance

- Every meaningful code, database, architecture, security, or configuration change must update `CHANGELOG.md` in the same working session.
- The changelog entry must be based on the actual diff and Git metadata (date, timestamp, commit hash/message summary, files changed, and validation results).
- NEVER fabricate changelog entries, timestamps, line counts, files, implementation details, or validation results.
- Trivial formatting-only or typo-only changes may be omitted.
- `CHANGELOG.md` is the human-readable record; Git history remains the authoritative source of truth.
- The changelog update should normally be included in the same commit as the related change, not as a separate changelog-only commit.

---

## 15. Git & Commit Conventions

- Keep commits logically focused and grouped by feature or fix.
- Follow standard conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.

---

## 16. Dependency Discipline

- Do NOT install new npm/pnpm packages without explicit authorization.
- Reuse project utilities (`cn()`, shadcn UI patterns, Lucide icons).

---

## 17. Avoiding Unrelated Changes

- Modify ONLY files relevant to the active task.
- Do NOT perform opportunistic refactoring, auto-formatting, or style changes on unrelated files.

---

## 18. Audit-Before-Change Requirement

- BEFORE modifying code, inspect source files, schemas, and recent commits to understand the current implementation.
- Never guess file paths, symbol names, or API contracts.
