'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { RoadmapService } from '@/services/roadmap.service';
import { GoalService } from '@/services/goal.service';
import { TaskService } from '@/services/task.service';
import type { PriorityLevel } from '@/types';

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function createGoalAction(
  _prevState: unknown,
  formData: FormData
) {
  const title = getStringValue(formData, 'title');
  const description = getStringValue(formData, 'description');
  const targetDate = getStringValue(formData, 'targetDate');
  const rawPriority = getStringValue(formData, 'priority');

  if (!title) {
    return { error: 'Goal title is required.' };
  }

  const priority: PriorityLevel =
    rawPriority === 'low' ||
    rawPriority === 'high' ||
    rawPriority === 'critical'
      ? rawPriority
      : 'medium';

  // 1. Generate execution roadmap via Gemini
  const roadmapResult = await RoadmapService.generateRoadmap({
    title,
    description: description || undefined,
    targetDate: targetDate || undefined,
    priority,
  });

  if (roadmapResult.error || !roadmapResult.roadmap) {
    return {
      error:
        roadmapResult.error ||
        'Failed to generate goal roadmap. Please try again.',
    };
  }

  // 2. Persist goal and roadmap atomically in PostgreSQL via RPC
  const goalResult = await GoalService.createGoal({
    title,
    description: description || undefined,
    targetDate: targetDate || undefined,
    priority,
    roadmap: roadmapResult.roadmap,
  });

  if (goalResult.error || !goalResult.goalId) {
    return {
      error:
        goalResult.error ||
        "We couldn't save your goal right now. Please try again.",
    };
  }

  revalidatePath('/', 'layout');
  redirect(`/goals/${goalResult.goalId}`);
}

export async function toggleTaskAction(taskId: string) {
  if (!taskId || typeof taskId !== 'string' || taskId.trim().length === 0) {
    return { error: 'Task ID is required.' };
  }

  const result = await TaskService.toggleTask(taskId.trim());

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath('/', 'layout');
  return { error: null };
}

export async function deleteGoalAction(goalId: string) {
  if (!goalId || typeof goalId !== 'string' || goalId.trim().length === 0) {
    return { error: 'Goal ID is required.' };
  }

  const result = await GoalService.deleteGoal(goalId.trim());

  if (result.error || !result.success) {
    return {
      error:
        result.error ||
        "We couldn't delete your goal right now. Please try again.",
    };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
