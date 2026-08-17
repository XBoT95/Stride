export type GoalStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: GoalStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sequenceOrder: number;
  status: MilestoneStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  milestoneId: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  status: TaskStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
}
