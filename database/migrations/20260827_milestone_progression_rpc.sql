-- ==========================================
-- Stride v0.1 Database Migration
-- Migration: database/migrations/20260827_milestone_progression_rpc.sql
-- Goal: Transactional Task Toggling and Automatic Milestone Advancement RPC
-- ==========================================

CREATE OR REPLACE FUNCTION public.toggle_task_and_advance_milestone(
  p_task_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_task RECORD;
  v_new_status public.task_status;
  v_incomplete_count INT;
  v_next_milestone_id UUID;
  v_advanced BOOLEAN := FALSE;
BEGIN
  -- 1. Authentication Guard
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated';
  END IF;

  -- 2. Locate task owned by caller and lock row to prevent race conditions
  SELECT t.id, t.milestone_id, t.goal_id, t.status, m.sequence_order AS milestone_seq
  INTO v_task
  FROM public.tasks t
  JOIN public.milestones m ON t.milestone_id = m.id
  WHERE t.id = p_task_id AND t.user_id = v_user_id
  FOR UPDATE OF t;

  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;

  -- 3. Toggle task completion status
  IF v_task.status = 'completed' THEN
    v_new_status := 'todo'::public.task_status;
  ELSE
    v_new_status := 'completed'::public.task_status;
  END IF;

  UPDATE public.tasks
  SET status = v_new_status, updated_at = NOW()
  WHERE id = p_task_id AND user_id = v_user_id;

  -- 4. Check for Milestone Advancement ONLY when transitioning INTO completed
  IF v_new_status = 'completed' THEN
    -- Count remaining incomplete tasks in the current milestone
    SELECT COUNT(*) INTO v_incomplete_count
    FROM public.tasks
    WHERE milestone_id = v_task.milestone_id
      AND user_id = v_user_id
      AND status != 'completed';

    -- If all tasks in current milestone are completed, advance next milestone
    IF v_incomplete_count = 0 THEN
      SELECT id INTO v_next_milestone_id
      FROM public.milestones
      WHERE goal_id = v_task.goal_id
        AND user_id = v_user_id
        AND sequence_order = (v_task.milestone_seq + 1);

      IF v_next_milestone_id IS NOT NULL THEN
        -- Schedule unscheduled tasks for next milestone to CURRENT_DATE
        UPDATE public.tasks
        SET scheduled_date = CURRENT_DATE, updated_at = NOW()
        WHERE milestone_id = v_next_milestone_id
          AND user_id = v_user_id
          AND scheduled_date IS NULL;

        v_advanced := TRUE;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'taskId', p_task_id,
    'status', v_new_status,
    'milestoneAdvanced', v_advanced
  );
END;
$$;

-- Privilege Configuration: Revoke public/anon access; Grant to authenticated users
REVOKE EXECUTE ON FUNCTION public.toggle_task_and_advance_milestone(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_task_and_advance_milestone(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_task_and_advance_milestone(UUID) TO authenticated;
