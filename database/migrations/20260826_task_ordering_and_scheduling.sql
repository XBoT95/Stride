-- ==========================================
-- Stride v0.1 Database Migration
-- Migration: database/migrations/20260826_task_ordering_and_scheduling.sql
-- Goals:
-- 1. Add sequence_order INT NOT NULL to public.tasks for stable ordering.
-- 2. Deterministically backfill existing task sequence_order values per milestone.
-- 3. Normalize existing development task scheduling (only Milestone 1 tasks scheduled for CURRENT_DATE).
-- 4. Create performance index for milestone-scoped task sequence order.
-- 5. Replace public.create_goal_with_roadmap RPC to populate sequence_order and schedule ONLY Milestone 1 tasks.
-- ==========================================

-- 1. Add sequence_order column with temporary default
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sequence_order INT DEFAULT 1;

-- 2. Deterministic backfill based on creation order (created_at ASC, id ASC) within each milestone
WITH ranked_tasks AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY milestone_id 
    ORDER BY created_at ASC, id ASC
  ) AS calc_seq
  FROM public.tasks
)
UPDATE public.tasks t
SET sequence_order = r.calc_seq
FROM ranked_tasks r
WHERE t.id = r.id;

-- 3. Enforce NOT NULL constraint after backfill
ALTER TABLE public.tasks ALTER COLUMN sequence_order SET NOT NULL;

-- 4. Normalize existing development task scheduling:
-- Keep Milestone 1 tasks scheduled for CURRENT_DATE; set Milestone 2+ tasks to NULL
UPDATE public.tasks t
SET scheduled_date = NULL
FROM public.milestones m
WHERE t.milestone_id = m.id
  AND m.sequence_order > 1;

-- 5. Create performance index for milestone-scoped sequence order sorting
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_seq ON public.tasks(milestone_id, sequence_order);

-- 6. Replace public.create_goal_with_roadmap RPC
CREATE OR REPLACE FUNCTION public.create_goal_with_roadmap(
  p_title TEXT,
  p_description TEXT,
  p_target_date DATE,
  p_priority public.priority_level,
  p_roadmap JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_goal_id UUID;
  v_milestone_id UUID;
  v_milestone JSONB;
  v_task JSONB;
  v_m_index INT := 1;
  v_t_index INT := 1;
  v_scheduled_date DATE;
BEGIN
  -- 1. Authentication Guard
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  -- 2. Insert Goal
  INSERT INTO public.goals (user_id, title, description, target_date, priority)
  VALUES (
    v_user_id,
    p_title,
    p_description,
    p_target_date,
    COALESCE(p_priority, 'medium'::public.priority_level)
  )
  RETURNING id INTO v_goal_id;

  -- 3. Iterate & Insert Milestones + Tasks
  FOR v_milestone IN SELECT * FROM pg_catalog.jsonb_array_elements(p_roadmap->'milestones') LOOP
    INSERT INTO public.milestones (goal_id, user_id, title, description, sequence_order, priority)
    VALUES (
      v_goal_id,
      v_user_id,
      v_milestone->>'title',
      v_milestone->>'description',
      v_m_index,
      COALESCE(p_priority, 'medium'::public.priority_level)
    )
    RETURNING id INTO v_milestone_id;

    -- Schedule ONLY Milestone 1 tasks for CURRENT_DATE; subsequent milestones receive NULL
    IF v_m_index = 1 THEN
      v_scheduled_date := CURRENT_DATE;
    ELSE
      v_scheduled_date := NULL;
    END IF;

    v_t_index := 1;
    FOR v_task IN SELECT * FROM pg_catalog.jsonb_array_elements(v_milestone->'tasks') LOOP
      INSERT INTO public.tasks (
        milestone_id,
        goal_id,
        user_id,
        title,
        description,
        scheduled_date,
        priority,
        sequence_order
      )
      VALUES (
        v_milestone_id,
        v_goal_id,
        v_user_id,
        v_task->>'title',
        v_task->>'description',
        v_scheduled_date,
        COALESCE(p_priority, 'medium'::public.priority_level),
        v_t_index
      );
      v_t_index := v_t_index + 1;
    END LOOP;

    v_m_index := v_m_index + 1;
  END LOOP;

  RETURN v_goal_id;
END;
$$;

-- Privilege Configuration: Revoke public/anon access; Grant to authenticated users
REVOKE EXECUTE ON FUNCTION public.create_goal_with_roadmap(TEXT, TEXT, DATE, public.priority_level, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_goal_with_roadmap(TEXT, TEXT, DATE, public.priority_level, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_goal_with_roadmap(TEXT, TEXT, DATE, public.priority_level, JSONB) TO authenticated;
