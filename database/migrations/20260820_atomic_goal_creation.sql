-- ==========================================
-- Stride v0.1 Database Migration
-- Migration: database/migrations/20260820_atomic_goal_creation.sql
-- Goal: Transactional Goal, Milestone, and Task Creation RPC
-- ==========================================

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

    FOR v_task IN SELECT * FROM pg_catalog.jsonb_array_elements(v_milestone->'tasks') LOOP
      INSERT INTO public.tasks (milestone_id, goal_id, user_id, title, description, scheduled_date, priority)
      VALUES (
        v_milestone_id,
        v_goal_id,
        v_user_id,
        v_task->>'title',
        v_task->>'description',
        CURRENT_DATE,
        COALESCE(p_priority, 'medium'::public.priority_level)
      );
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
