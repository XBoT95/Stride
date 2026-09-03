import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Task } from '@/types';

export interface TaskWithGoal extends Task {
  sequenceOrder?: number;
  milestoneSequenceOrder?: number;
  goalTitle?: string;
}

export interface GetTodayTasksResult {
  tasks: TaskWithGoal[] | null;
  error: string | null;
}

export interface ToggleTaskResult {
  task: Task | null;
  error: string | null;
}

interface RawTaskRow {
  id: string;
  milestone_id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  scheduled_date: string;
  status: Task['status'];
  priority: Task['priority'];
  sequence_order?: number;
  created_at: string;
  updated_at: string;
}

export class TaskService {
  /**
   * Retrieves tasks scheduled for today for the authenticated user, fetching Goal titles
   * and parent Milestone sequence orders to sort deterministically by (milestone.sequence_order ASC, task.sequence_order ASC).
   */
  static async getTodayTasks(): Promise<GetTodayTasksResult> {
    try {
      const supabase = await createServerClient();

      // 1. Fetch today's tasks for authenticated user
      const { data: rawTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('scheduled_date', 'today')
        .neq('status', 'archived');

      if (tasksError || !rawTasks) {
        return { tasks: null, error: 'Unable to retrieve today tasks.' };
      }

      if (rawTasks.length === 0) {
        return { tasks: [], error: null };
      }

      const rawTaskRows = rawTasks as unknown as RawTaskRow[];
      const goalIds = Array.from(new Set(rawTaskRows.map((t) => t.goal_id)));
      const milestoneIds = Array.from(
        new Set(rawTaskRows.map((t) => t.milestone_id))
      );

      // 2. Fetch parent goal titles for unique goal IDs
      const { data: rawGoals } = await supabase
        .from('goals')
        .select('id, title')
        .in('id', goalIds);

      const goalMap = new Map<string, string>();
      if (rawGoals) {
        for (const g of rawGoals as { id: string; title: string }[]) {
          goalMap.set(g.id, g.title);
        }
      }

      // 3. Fetch parent milestone sequence orders for unique milestone IDs
      const { data: rawMilestones } = await supabase
        .from('milestones')
        .select('id, sequence_order')
        .in('id', milestoneIds);

      const milestoneSeqMap = new Map<string, number>();
      if (rawMilestones) {
        for (const m of rawMilestones as {
          id: string;
          sequence_order: number;
        }[]) {
          milestoneSeqMap.set(m.id, m.sequence_order);
        }
      }

      // 4. Map tasks and attach milestoneSequenceOrder
      const tasks: TaskWithGoal[] = rawTaskRows.map((t: RawTaskRow) => ({
        id: t.id,
        milestoneId: t.milestone_id,
        goalId: t.goal_id,
        userId: t.user_id,
        title: t.title,
        description: t.description || undefined,
        scheduledDate: t.scheduled_date,
        status: t.status,
        priority: t.priority,
        sequenceOrder: t.sequence_order,
        milestoneSequenceOrder: milestoneSeqMap.get(t.milestone_id) ?? 1,
        goalTitle: goalMap.get(t.goal_id),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      // 5. Sort deterministically by milestone.sequence_order ASC, then task.sequence_order ASC
      tasks.sort((a, b) => {
        const mSeqA = a.milestoneSequenceOrder ?? 1;
        const mSeqB = b.milestoneSequenceOrder ?? 1;
        if (mSeqA !== mSeqB) {
          return mSeqA - mSeqB;
        }

        const tSeqA = a.sequenceOrder ?? 1;
        const tSeqB = b.sequenceOrder ?? 1;
        if (tSeqA !== tSeqB) {
          return tSeqA - tSeqB;
        }

        return a.createdAt.localeCompare(b.createdAt);
      });

      return { tasks, error: null };
    } catch {
      return { tasks: null, error: 'Unable to retrieve today tasks.' };
    }
  }

  /**
   * Toggles task completion status and triggers automatic milestone advancement
   * via PostgreSQL stored procedure public.toggle_task_and_advance_milestone.
   * Accepts ONLY taskId; preserves Server Action signature and caller-state isolation.
   */
  static async toggleTask(taskId: string): Promise<ToggleTaskResult> {
    if (!taskId) {
      return { task: null, error: 'Task ID is required.' };
    }

    try {
      const supabase = await createServerClient();

      // Call atomic RPC toggle_task_and_advance_milestone
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'toggle_task_and_advance_milestone',
        { p_task_id: taskId }
      );

      if (rpcError || !rpcResult) {
        return {
          task: null,
          error:
            "We couldn't update the task right now. Please try again in a moment.",
        };
      }

      // Fetch updated task row for caller return object
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !data) {
        return {
          task: null,
          error:
            "We couldn't update the task right now. Please try again in a moment.",
        };
      }

      const rawTask = data as unknown as RawTaskRow;
      const updatedTask: Task = {
        id: rawTask.id,
        milestoneId: rawTask.milestone_id,
        goalId: rawTask.goal_id,
        userId: rawTask.user_id,
        title: rawTask.title,
        description: rawTask.description || undefined,
        scheduledDate: rawTask.scheduled_date,
        status: rawTask.status,
        priority: rawTask.priority,
        createdAt: rawTask.created_at,
        updatedAt: rawTask.updated_at,
      };

      return { task: updatedTask, error: null };
    } catch {
      return {
        task: null,
        error:
          "We couldn't update the task right now. Please try again in a moment.",
      };
    }
  }
}
