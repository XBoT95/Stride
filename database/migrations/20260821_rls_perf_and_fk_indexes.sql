-- ==========================================
-- Stride v0.1 Database Performance Migration
-- Migration: database/migrations/20260821_rls_perf_and_fk_indexes.sql
-- Goals:
-- 1. RLS auth.uid() initialization optimization (wrap auth.uid() in scalar subquery (select auth.uid()))
-- 2. Create FK-supporting composite indexes for milestones and tasks foreign-key relationships
-- ==========================================

-- 1. PROFILES RLS POLICY OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "System can insert profiles via auth trigger" ON public.profiles;
CREATE POLICY "System can insert profiles via auth trigger"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- 2. GOALS RLS POLICY OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
CREATE POLICY "Users can create their own goals"
  ON public.goals FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 3. MILESTONES RLS POLICY OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own milestones" ON public.milestones;
CREATE POLICY "Users can view their own milestones"
  ON public.milestones FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own milestones" ON public.milestones;
CREATE POLICY "Users can create their own milestones"
  ON public.milestones FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own milestones" ON public.milestones;
CREATE POLICY "Users can update their own milestones"
  ON public.milestones FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own milestones" ON public.milestones;
CREATE POLICY "Users can delete their own milestones"
  ON public.milestones FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 4. TASKS RLS POLICY OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 5. FOREIGN-KEY SUPPORTING INDEXES
CREATE INDEX IF NOT EXISTS idx_milestones_goal_user ON public.milestones(goal_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_hierarchy ON public.tasks(milestone_id, goal_id, user_id);
