# Database Schema & Architecture Specification — Stride

> **Status:** Active Baseline Specification (v0.1)  
> **Audience:** Core Architects, Database Administrators, AI Execution Agents

---

## 1. Overview & Architectural Principles

The Stride v0.1 database is built on PostgreSQL inside Supabase, designed for high performance, strict data isolation, and hierarchical ownership integrity.

### Core Database Principles
1. **Hierarchical Ownership Integrity**: Database-level composite foreign keys enforce that child records (`milestones`, `tasks`) strictly belong to the exact `user_id` and `goal_id` of their parent hierarchy.
2. **Zero-Overhead RLS**: Every table retains a direct `user_id` column indexed for lightning-fast Row Level Security evaluation (`auth.uid() = user_id`) without requiring subquery JOINs.
3. **Mandatory Execution Path**: Every task belongs to a milestone, and every milestone belongs to a goal (`Goal -> Milestone -> Task`).
4. **Idempotence & Non-Destructive Migrations**: Initial setup scripts are re-runnable without wiping existing data.

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
- **Attributes**: `title`, `description`, `scheduled_date` (DATE, default `CURRENT_DATE`), `status` (`task_status`), `priority` (`priority_level`).

---

## 3. Migration & Re-Execution Strategy

- **Baseline Application**: `database/schemas/00_all_schemas.sql` is applied once during initial project setup via Supabase SQL Editor or Supabase CLI.
- **Idempotency Standards**:
  - PostgreSQL `DO $$` blocks check `pg_type` before creating enums (`IF NOT EXISTS`).
  - `DROP POLICY IF EXISTS` is used prior to `CREATE POLICY`.
  - `DROP TRIGGER IF EXISTS` is used prior to `CREATE TRIGGER`.
  - `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` guard entity creation.
- **Future Schema Evolution**:
  - Schema modifications post-v0.1 will be written as timestamped SQL migration files inside `database/migrations/` (e.g., `20260815_security_hardening.sql`).
  - Baseline scripts (`database/schemas/`) will be updated in tandem to reflect the state of new baseline deployments.

---

## 4. Function Security Hardening

To satisfy security audit standards and eliminate Supabase Database Advisor warnings, database functions enforce an empty search path (`SET search_path = ''`) and privilege boundaries:

1. **`handle_updated_at()`**:
   - Executes as `SECURITY INVOKER` (default).
   - Configured with `SET search_path = ''` to completely eliminate search-path manipulation during trigger updates.

2. **`handle_new_user()`**:
   - Requires **`SECURITY DEFINER`** because it is triggered by an `INSERT` on `auth.users` (managed by Supabase Auth engine) and must write across schema boundaries into `public.profiles`.
   - Configured with `SET search_path = ''` and fully qualified schema references (`public.profiles`).
   - **Direct `EXECUTE` Privilege Revocation**: Direct execution rights are explicitly revoked (`REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated`). Normal users cannot call this function as a Remote Procedure Call (RPC).
   - **Trigger Integrity**: The PostgreSQL trigger `on_auth_user_created ON auth.users` executes the function under trigger definer context, ensuring user registration auto-sync continues to create `public.profiles` records without exposing security risks.
