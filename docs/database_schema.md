# Database Schema & Architecture Specification — Stride

> **Status:** Active Baseline Specification (v0.1)  
> **Audience:** Core Architects, Database Administrators, AI Execution Agents

---

## 1. Overview & Architectural Principles

The Stride v0.1 database is built on PostgreSQL inside Supabase, designed for high performance, strict data isolation, and hierarchical ownership integrity.

### Core Database Principles
1. **Hierarchical Ownership Integrity**: Database-level composite foreign keys enforce that child records (`milestones`, `tasks`) strictly belong to the exact `user_id` and `goal_id` of their parent hierarchy.
2. **Zero-Overhead RLS**: Every table retains a direct `user_id` column indexed for lightning-fast Row Level Security evaluation (`(select auth.uid()) = user_id`) without requiring subquery JOINs.
3. **Mandatory Execution Path**: Every task belongs to a milestone, and every milestone belongs to a goal (`Goal -> Milestone -> Task`).
4. **Idempotence & Non-Destructive Migrations**: Setup scripts and migrations are re-runnable without wiping existing data.

---

## 2. Entity Specifications & Composite Constraints

### 2.1 `profiles`
- **Primary Key**: `id` (UUID, references `auth.users(id)` ON DELETE CASCADE).
- **Attributes**: `email`, `full_name`, `created_at`, `updated_at`.
- **Auth Sync**: `handle_new_user()` function auto-populates `profiles` when a user registers via Supabase Auth.

### 2.2 `goals`
- **Primary Key**: `id` (UUID, default `gen_random_uuid()`).
- **Foreign Key**: `user_id` $\rightarrow$ `profiles.id` (ON DELETE CASCADE).
- **Composite Unique Constraint**: `CONSTRAINT uq_goals_id_user UNIQUE (id, user_id)` (Enables child composite foreign key linking).
- **Attributes**: `title`, `description`, `target_date`, `status` (`goal_status`), `priority` (`priority_level`).

### 2.3 `milestones`
- **Primary Key**: `id` (UUID, default `gen_random_uuid()`).
- **Composite Foreign Key**: `CONSTRAINT fk_milestones_goal_user FOREIGN KEY (goal_id, user_id) REFERENCES public.goals(id, user_id) ON DELETE CASCADE`
- **Composite Unique Constraint**: `CONSTRAINT uq_milestones_id_goal_user UNIQUE (id, goal_id, user_id)` (Enables task composite foreign key linking).
- **Attributes**: `title`, `description`, `sequence_order` (INT), `status` (`milestone_status`), `priority` (`priority_level`).

### 2.4 `tasks`
- **Primary Key**: `id` (UUID, default `gen_random_uuid()`).
- **Mandatory Foreign Keys**:
  - `milestone_id` (UUID NOT NULL)
  - `goal_id` (UUID NOT NULL)
  - `user_id` (UUID NOT NULL)
- **Composite Foreign Key**: `CONSTRAINT fk_tasks_milestone_hierarchy FOREIGN KEY (milestone_id, goal_id, user_id) REFERENCES public.milestones(id, goal_id, user_id) ON DELETE CASCADE`
- **Attributes**: `title`, `description`, `scheduled_date` (DATE, default `CURRENT_DATE`), `status` (`task_status`), `priority` (`priority_level`), `sequence_order` (INT NOT NULL DEFAULT 1).

---

## 3. Migration & Re-Execution Strategy

- **Baseline Application**: `database/schemas/00_all_schemas.sql` is applied once during initial project setup.
- **Idempotency Standards**:
  - PostgreSQL `DO $$` blocks check `pg_type` before creating enums (`IF NOT EXISTS`).
  - `DROP POLICY IF EXISTS` is used prior to `CREATE POLICY`.
  - `DROP TRIGGER IF EXISTS` is used prior to `CREATE TRIGGER`.
  - `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` guard entity creation.
- **Timestamped Migrations**:
  - `20260815_security_hardening.sql`: Hardened search_path and EXECUTE revocations.
  - `20260820_atomic_goal_creation.sql`: Transactional `create_goal_with_roadmap` RPC.
  - `20260821_rls_perf_and_fk_indexes.sql`: RLS `(select auth.uid())` subquery performance optimization & FK indexes.
  - `20260826_task_ordering_and_scheduling.sql`: Adds `tasks.sequence_order`, deterministic backfill, milestone-scoped sorting index `idx_tasks_milestone_seq`, and updates `create_goal_with_roadmap` to schedule only Milestone 1.
  - `20260827_milestone_progression_rpc.sql`: Transactional task toggling & milestone advancement RPC `toggle_task_and_advance_milestone`.

---

## 4. Function Security Hardening & RPCs

Database functions enforce empty search paths (`SET search_path = ''`), `SECURITY INVOKER`, and explicit privilege boundaries:

1. **`handle_updated_at()`**: `SECURITY INVOKER`, `SET search_path = ''`.
2. **`handle_new_user()`**: `SECURITY DEFINER`, `SET search_path = ''`. Executed by auth trigger only.
3. **`create_goal_with_roadmap(p_title, p_description, p_target_date, p_priority, p_roadmap)`**:
   - `SECURITY INVOKER`, `SET search_path = ''`.
   - Atomically inserts Goal, Milestones, and Tasks inside a single PostgreSQL transaction.
   - Assigns `sequence_order` starting at 1 for both milestones and tasks.
   - Schedules ONLY Milestone 1 tasks (`sequence_order = 1`) for `CURRENT_DATE`. Milestone 2+ tasks receive `scheduled_date = NULL`.
   - Executable ONLY by `authenticated` role (`REVOKE` from `PUBLIC`, `anon`).
4. **`toggle_task_and_advance_milestone(p_task_id)`**:
   - `SECURITY INVOKER`, `SET search_path = ''`.
   - Acquires row lock `FOR UPDATE OF t` on target task to prevent race conditions.
   - Toggles task completion status (`todo` $\leftrightarrow$ `completed`).
   - When transitioning INTO `completed`, evaluates if all tasks in the current milestone are completed.
   - If current milestone is 100% completed, locates the next milestone (`sequence_order + 1`) and schedules its `NULL` tasks for `CURRENT_DATE`.
   - Toggling a task back to `todo` preserves previously activated milestone scheduling (non-destructive forward progress).
   - Executable ONLY by `authenticated` role (`REVOKE` from `PUBLIC`, `anon`).
