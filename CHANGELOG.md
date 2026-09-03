# Changelog — Stride

All notable changes to Stride are documented in this file in reverse chronological order.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and reflects the verified Git commit history of the `XBoT95/Stride` repository.

---

## [0.1.0] - 2026-09-03

### 2026-09-03 22:15:00 +0530

#### feat(dashboard): improve task display and goal management

**Commit:** `58535f9`

**Summary**
Implemented two-level milestone task sorting on the Dashboard, populated parent goal titles across today's tasks without invalid PostgREST relation embeddings, fixed Goal Detail task completion revalidation, and added an accessible 2-step Delete Goal Danger Zone.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/app/goals/actions.ts` | Modified | 16 | 2 |
| `app/src/app/goals/[id]/page.tsx` | Modified | 2 | 0 |
| `app/src/app/page.tsx` | Modified | 77 | 12 |
| `app/src/components/goals/DeleteGoalDangerZone.tsx` | Added | 134 | 0 |
| `app/src/components/goals/RoadmapTree.tsx` | Modified | 6 | 32 |
| `app/src/components/tasks/TaskList.tsx` | Modified | 47 | 11 |
| `app/src/services/goal.service.ts` | Modified | 41 | 0 |
| `app/src/services/roadmap.service.ts` | Modified | 4 | 4 |
| `app/src/services/task.service.ts` | Modified | 64 | 26 |

**Implementation Details**
- **Two-Level Sorting**: Updated `TaskService.getTodayTasks()` to map parent `milestoneSequenceOrder` and sort tasks by `(milestone.sequence_order ASC, task.sequence_order ASC, created_at ASC)`, preventing Milestone 2 tasks from being interleaved between Milestone 1 tasks.
- **PostgREST Query Fix**: Resolved PostgREST `PGRST200` relation error in `TaskService.getTodayTasks()` by replacing invalid relation embedding (`.select('*, goals(id, title)')`) with a separate goal metadata lookup query.
- **Goal Detail Interactive Task Controls**: Replaced static `<li>` elements in `RoadmapTree.tsx` with interactive `TaskItem` components.
- **Layout Cache Revalidation**: Updated `toggleTaskAction` in `actions.ts` to call `revalidatePath('/', 'layout')`, revalidating both Dashboard and Goal Detail page caches.
- **Delete Goal Danger Zone**: Added `DeleteGoalDangerZone` client component at the bottom of `/goals/[id]`, featuring GitHub-style alert styling and an accessible 2-step confirmation modal (`Cancel` vs `Delete Goal`). Invokes `deleteGoalAction` $\rightarrow$ `GoalService.deleteGoal`, leveraging PostgreSQL `ON DELETE CASCADE` and RLS `(select auth.uid()) = user_id`.

**Database / Security / Architecture**
- Leveraged existing composite foreign key `ON DELETE CASCADE` constraints (`fk_milestones_goal_user` and `fk_tasks_milestone_hierarchy`) for atomic cascading deletion.
- RLS policy `(select auth.uid()) = user_id` enforces strict ownership isolation during goal deletion.

**Validation**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm lint`: 0 warnings/errors.
- `pnpm build`: Next.js 16.3.0 production build compiled clean.

---

### 2026-09-03 21:42:00 +0530

#### feat(goals): add roadmap tasks and milestone progression

**Commit:** `33af96d`

**Summary**
Connected domain services and Server Actions to presentation components and Next.js App Router pages (`/goals/new`, `/goals/[id]`, `/`), establishing the end-to-end v0.1 user journey.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/app/goals/[id]/page.tsx` | Added | 75 | 0 |
| `app/src/app/goals/new/page.tsx` | Added | 52 | 0 |
| `app/src/app/goals/actions.ts` | Added | 86 | 0 |
| `app/src/components/goals/CreateGoalForm.tsx` | Added | 114 | 0 |
| `app/src/components/goals/RoadmapTree.tsx` | Added | 154 | 0 |
| `app/src/components/tasks/TaskItem.tsx` | Added | 90 | 0 |
| `app/src/components/tasks/TaskList.tsx` | Added | 52 | 0 |

**Implementation Details**
- Created `/goals/new/page.tsx` rendering React 19 `useActionState` `CreateGoalForm`.
- Created `/goals/[id]/page.tsx` rendering Goal summary and `RoadmapTree` visualization.
- Created `actions.ts` containing Server Actions `createGoalAction` and `toggleTaskAction`.
- Integrated `TaskList` and `TaskItem` into the root Dashboard page (`/page.tsx`).

**Validation**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm lint`: 0 warnings/errors.
- `pnpm build`: Next.js 16.3.0 production build compiled clean.

---

### 2026-08-26 19:15:00 +0530

#### feat(goals): add AI-powered goal roadmap creation

**Commit:** `752b790`

**Summary**
Implemented `RoadmapService` using Google Gemini 3.6 Flash (`@google/genai`) with Zod schema validation, and `GoalService` to manage domain persistence.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/services/roadmap.service.ts` | Added | 181 | 0 |
| `app/src/services/goal.service.ts` | Added | 226 | 0 |
| `app/src/services/task.service.ts` | Added | 139 | 0 |
| `app/package.json` | Modified | 2 | 0 |
| `app/pnpm-lock.yaml` | Modified | 340 | 0 |

**Implementation Details**
- `RoadmapService.generateRoadmap()` uses `gemini-3.6-flash` with `responseMimeType: "application/json"` and `RoadmapSchema` Zod validation (3–6 milestones, 2–5 beginner tasks per milestone).
- Prompt guidelines require 5–15 minute single-action beginner tasks with step-by-step instructions.
- `GoalService.createGoal()` invokes atomic stored procedure `public.create_goal_with_roadmap`.
- `TaskService.getTodayTasks()` queries tasks using PostgreSQL `scheduled_date = 'today'`.

**Validation**
- Tested Gemini 3.6 Flash structured JSON responses and Zod parsing.

---

### 2026-08-26 12:10:00 +0530

#### feat(db): add task ordering and milestone progression

**Commit:** `fabdd9d`

**Summary**
Added `sequence_order` column to `public.tasks`, backfilled existing task sequence orders, and created stored procedure `public.toggle_task_and_advance_milestone` for automatic milestone scheduling progression.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `database/migrations/20260826_task_ordering_and_scheduling.sql` | Added | 137 | 0 |
| `database/migrations/20260827_milestone_progression_rpc.sql` | Added | 93 | 0 |
| `docs/database_schema.md` | Modified | 67 | 51 |

**Implementation Details**
- `20260826_task_ordering_and_scheduling.sql`: Adds `tasks.sequence_order INT NOT NULL`, backfills using `ROW_NUMBER() OVER (PARTITION BY milestone_id ORDER BY created_at ASC, id ASC)`, creates index `idx_tasks_milestone_seq`, and updates `create_goal_with_roadmap` RPC to schedule only Milestone 1 tasks for `CURRENT_DATE`.
- `20260827_milestone_progression_rpc.sql`: Creates `toggle_task_and_advance_milestone` RPC with `FOR UPDATE OF t` row locking. Toggles task status, checks milestone completion, and schedules Milestone N+1 tasks for `CURRENT_DATE`.

**Database / Security**
- Security mode: `SECURITY INVOKER` with `SET search_path = ''`.
- Privileges: `REVOKE EXECUTE FROM PUBLIC, anon; GRANT EXECUTE TO authenticated;`.

---

### 2026-08-21 11:45:00 +0530

#### chore(db): optimize RLS policies and foreign key indexes

**Commit:** `bff2752`

**Summary**
Optimized Row Level Security policies across all tables using scalar subqueries `(select auth.uid())` to eliminate Supabase Performance Advisor initialization-plan warnings, created FK-supporting composite indexes, and implemented atomic goal creation RPC.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `database/migrations/20260820_atomic_goal_creation.sql` | Added | 80 | 0 |
| `database/migrations/20260821_rls_perf_and_fk_indexes.sql` | Added | 95 | 0 |
| `docs/database_schema.md` | Added | 94 | 0 |

**Implementation Details**
- `20260820_atomic_goal_creation.sql`: Creates RPC `public.create_goal_with_roadmap(p_title, p_description, p_target_date, p_priority, p_roadmap)` inserting Goal, Milestones, and Tasks inside a single transaction.
- `20260821_rls_perf_and_fk_indexes.sql`: Replaces `auth.uid() = user_id` with `(select auth.uid()) = user_id` across 15 RLS policies. Creates composite indexes `idx_milestones_goal_user` and `idx_tasks_milestone_hierarchy`.

---

## [0.0.1] - 2026-08-12

### 2026-08-12 16:30:00 +0530

#### refactor: harden foundation code quality

**Commit:** `12d5a71`

**Summary**
Hardened code quality across authentication services, Server Components, and Supabase client configuration.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/services/auth.service.ts` | Modified | 18 | 4 |
| `app/src/lib/supabase/server.ts` | Modified | 12 | 2 |

---

### 2026-08-11 14:15:00 +0530

#### chore(cleanup): remove unused scaffold assets and auth code

**Commit:** `3a908e6`

**Summary**
Cleaned up unused boilerplate template files, initial asset placeholders, and extraneous authentication code.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/public/vercel.svg` | Deleted | 0 | 1 |
| `app/public/next.svg` | Deleted | 0 | 1 |

---

### 2026-08-10 11:20:00 +0530

#### fix(auth): correct Supabase project URL configuration

**Commit:** `13f48d1`

**Summary**
Corrected `NEXT_PUBLIC_SUPABASE_URL` environment configuration to reference the base project domain (`https://cgotekbmgyqbawmmfbwt.supabase.co`) without trailing path suffixes.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/.env.local` | Modified | 2 | 2 |

---

### 2026-08-09 10:04:47 +0530

#### feat(auth): implement authentication foundation

**Commit:** `ac0ccb6`

**Summary**
Implemented user authentication flow including Login page, Signup page, Server Actions for auth, `AuthService`, and Next.js middleware session protection.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/app/(auth)/login/page.tsx` | Added | 82 | 0 |
| `app/src/app/(auth)/signup/page.tsx` | Added | 96 | 0 |
| `app/src/app/(auth)/actions.ts` | Added | 58 | 0 |
| `app/src/services/auth.service.ts` | Added | 114 | 0 |
| `app/src/middleware.ts` | Added | 42 | 0 |

---

### 2026-08-08 09:38:39 +0530

#### feat(supabase): establish client foundation

**Commit:** `50beda9`

**Summary**
Configured `@supabase/ssr` (v0.5.2) and `@supabase/supabase-js` (v2.49.1) integration for Server Components, Client Components, and Next.js middleware.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/src/lib/supabase/client.ts` | Added | 14 | 0 |
| `app/src/lib/supabase/server.ts` | Added | 36 | 0 |
| `app/src/lib/supabase/middleware.ts` | Added | 48 | 0 |

---

### 2026-08-07 10:14:02 +0530

#### Refined SQL

**Commit:** `dee5cbf`

**Summary**
Refined master SQL schema script `database/schemas/00_all_schemas.sql` combining all table definitions, triggers, indexes, and RLS policies into an idempotent baseline deployment script.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `database/schemas/00_all_schemas.sql` | Added | 240 | 0 |

---

### 2026-08-07 09:37:37 +0530

#### Database Foundation Initialized

**Commit:** `be82f3b`

**Summary**
Created core database module schemas (`01_profiles.sql`, `02_enums.sql`, `03_goals.sql`, `04_milestones.sql`, `05_tasks.sql`) and initial security migration `20260815_security_hardening.sql`.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `database/schemas/01_profiles.sql` | Added | 48 | 0 |
| `database/schemas/02_enums.sql` | Added | 28 | 0 |
| `database/schemas/03_goals.sql` | Added | 57 | 0 |
| `database/schemas/04_milestones.sql` | Added | 59 | 0 |
| `database/schemas/05_tasks.sql` | Added | 60 | 0 |
| `database/migrations/20260815_security_hardening.sql` | Added | 52 | 0 |

---

### 2026-08-06 17:51:24 +0530

#### docs: establish Next.js 16.3.0 as canonical version

**Commit:** `7b9b03e`

**Summary**
Documented Next.js 16.3.0 App Router as the canonical core framework for Stride v0.1 in ADR-001.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `docs/architecture-decisions.md` | Modified | 14 | 2 |

---

### 2026-08-05 18:25:01 +0530

#### Sprint 1: Initialize project foundation

**Commit:** `54976c2`

**Summary**
Initialized Next.js 16.3.0 App Router project inside `/app`, configured Tailwind CSS v4, TypeScript, shadcn/ui components JSON, Lucide icons, and domain DTO interfaces (`app/src/types/index.ts`).

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app/package.json` | Added | 33 | 0 |
| `app/pnpm-lock.yaml` | Added | 4298 | 0 |
| `app/pnpm-workspace.yaml` | Added | 16 | 0 |
| `app/src/types/index.ts` | Added | 51 | 0 |
| `app/src/lib/utils.ts` | Added | 6 | 0 |
| `app/src/app/layout.tsx` | Added | 29 | 0 |
| `app/src/app/page.tsx` | Added | 69 | 0 |

---

### 2026-08-04 21:48:34 +0530

#### Sprint 0: Establish project architecture and documentation

**Commit:** `978649b`

**Summary**
Established core architectural specifications, decision records (ADRs), entity relationship documentation, engineering principles, and error handling philosophy.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `docs/architecture-decisions.md` | Added | 130 | 0 |
| `docs/engineering-principles.md` | Added | 88 | 0 |
| `docs/erd.md` | Added | 135 | 0 |
| `docs/error-philosophy.md` | Added | 102 | 0 |

---

### 2026-08-02 20:40:58 +0530

#### converted files to folders

**Commit:** `193030a`

**Summary**
Converted placeholder directory gitkeep files into dedicated directory structures for `/app` and `/database`.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `app` | Deleted | 0 | 1 |
| `database` | Deleted | 0 | 1 |

---

### 2026-08-02 20:25:42 +0530

#### Add project documentation for Stride

**Commit:** `28293a6`

**Summary**
Added initial project overview document `docs/project.md` detailing product vision, problem statement, target users, core principles, MVP scope, and long-term roadmap.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `docs/project.md` | Added | 208 | 0 |

---

### 2026-08-01 21:49:40 +0530

#### Initial commit

**Commit:** `a981558`

**Summary**
Created repository baseline with MIT License and initial README.

**Files Changed**

| File | Status | Lines Added | Lines Removed |
|---|---|---:|---:|
| `LICENSE` | Added | 21 | 0 |
| `README.md` | Added | 1 | 0 |
