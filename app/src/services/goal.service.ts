import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Goal, Milestone, Task, PriorityLevel } from '@/types';
import type { ValidatedRoadmap } from '@/services/roadmap.service';

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: PriorityLevel;
  roadmap: ValidatedRoadmap;
}

export interface MilestoneWithTasks extends Milestone {
  tasks: Task[];
}

export interface GoalWithDetails extends Goal {
  milestones: MilestoneWithTasks[];
}

export interface CreateGoalResult {
  goalId: string | null;
  error: string | null;
}

export interface GetGoalResult {
  goal: GoalWithDetails | null;
  error: string | null;
}

export interface GetGoalsResult {
  goals: Goal[] | null;
  error: string | null;
}

export interface DeleteGoalResult {
  success: boolean;
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

interface RawMilestoneRow {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  sequence_order: number;
  status: Milestone['status'];
  priority: Milestone['priority'];
  created_at: string;
  updated_at: string;
  tasks?: RawTaskRow[];
}

interface RawGoalRow {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  target_date?: string | null;
  status: Goal['status'];
  priority: Goal['priority'];
  created_at: string;
  updated_at: string;
  milestones?: RawMilestoneRow[];
}

export class GoalService {
  /**
   * Persists a complete goal and its AI-generated execution roadmap atomically
   * via PostgreSQL stored procedure public.create_goal_with_roadmap.
   */
  static async createGoal(input: CreateGoalInput): Promise<CreateGoalResult> {
    if (!input.title || input.title.trim().length === 0) {
      return { goalId: null, error: 'Goal title is required.' };
    }

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase.rpc('create_goal_with_roadmap', {
        p_title: input.title.trim(),
        p_description: input.description?.trim() || null,
        p_target_date: input.targetDate || null,
        p_priority: input.priority || 'medium',
        p_roadmap: input.roadmap,
      });

      if (error || !data) {
        return {
          goalId: null,
          error:
            "We couldn't save your goal right now. Please try again in a moment.",
        };
      }

      return { goalId: data as string, error: null };
    } catch {
      return {
        goalId: null,
        error:
          "We couldn't save your goal right now. Please try again in a moment.",
      };
    }
  }

  /**
   * Retrieves a single goal by ID for the authenticated user, together with
   * its ordered milestones and tasks. Protected by Supabase Row Level Security.
   * Explicitly sorts milestones and nested tasks by sequence_order ASC.
   */
  static async getGoal(id: string): Promise<GetGoalResult> {
    if (!id) {
      return { goal: null, error: 'Goal ID is required.' };
    }

    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('goals')
        .select(
          `
          *,
          milestones (
            *,
            tasks (*)
          )
        `
        )
        .eq('id', id)
        .order('sequence_order', {
          referencedTable: 'milestones',
          ascending: true,
        })
        .order('sequence_order', {
          referencedTable: 'milestones.tasks',
          ascending: true,
        })
        .single();

      if (error || !data) {
        return { goal: null, error: 'Goal not found.' };
      }

      const rawGoal = data as unknown as RawGoalRow;
      const sortedMilestones = (rawGoal.milestones || [])
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((m: RawMilestoneRow) => ({
          id: m.id,
          goalId: m.goal_id,
          userId: m.user_id,
          title: m.title,
          description: m.description || undefined,
          sequenceOrder: m.sequence_order,
          status: m.status,
          priority: m.priority,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          tasks: (m.tasks || [])
            .sort((a, b) => (a.sequence_order ?? 1) - (b.sequence_order ?? 1))
            .map((t: RawTaskRow) => ({
              id: t.id,
              milestoneId: t.milestone_id,
              goalId: t.goal_id,
              userId: t.user_id,
              title: t.title,
              description: t.description || undefined,
              scheduledDate: t.scheduled_date,
              status: t.status,
              priority: t.priority,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            })),
        }));

      const goal: GoalWithDetails = {
        id: rawGoal.id,
        userId: rawGoal.user_id,
        title: rawGoal.title,
        description: rawGoal.description || undefined,
        targetDate: rawGoal.target_date || undefined,
        status: rawGoal.status,
        priority: rawGoal.priority,
        createdAt: rawGoal.created_at,
        updatedAt: rawGoal.updated_at,
        milestones: sortedMilestones,
      };

      return { goal, error: null };
    } catch {
      return { goal: null, error: 'Goal not found.' };
    }
  }

  /**
   * Retrieves all goals for the authenticated user, ordered by creation date.
   */
  static async getGoals(): Promise<GetGoalsResult> {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return { goals: null, error: 'Unable to retrieve goals.' };
      }

      const rawGoals = data as unknown as RawGoalRow[];
      const goals: Goal[] = rawGoals.map((g: RawGoalRow) => ({
        id: g.id,
        userId: g.user_id,
        title: g.title,
        description: g.description || undefined,
        targetDate: g.target_date || undefined,
        status: g.status,
        priority: g.priority,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));

      return { goals, error: null };
    } catch {
      return { goals: null, error: 'Unable to retrieve goals.' };
    }
  }

  /**
   * Permanently deletes a goal for the authenticated user.
   * Leverages PostgreSQL composite ON DELETE CASCADE foreign key constraints to automatically
   * delete associated milestones and tasks in a single atomic transaction.
   * Strictly protected by Supabase Row Level Security ((select auth.uid()) = user_id).
   */
  static async deleteGoal(goalId: string): Promise<DeleteGoalResult> {
    if (!goalId) {
      return { success: false, error: 'Goal ID is required.' };
    }

    try {
      const supabase = await createServerClient();

      const { error, count } = await supabase
        .from('goals')
        .delete({ count: 'exact' })
        .eq('id', goalId);

      if (error) {
        return {
          success: false,
          error:
            "We couldn't delete your goal right now. Please try again in a moment.",
        };
      }

      if (count === 0) {
        return {
          success: false,
          error: 'Goal not found or access denied.',
        };
      }

      return { success: true, error: null };
    } catch {
      return {
        success: false,
        error:
          "We couldn't delete your goal right now. Please try again in a moment.",
      };
    }
  }
}
