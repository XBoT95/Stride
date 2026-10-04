import type { Task } from '@/types';
import { TaskItem } from '@/components/tasks/TaskItem';
import { CheckCircle2, Plus, Target } from 'lucide-react';
import Link from 'next/link';

interface TaskWithGoalMeta extends Task {
  goalTitle?: string;
}

interface TaskListProps {
  tasks: TaskWithGoalMeta[] | null;
  hasGoals?: boolean;
}

export function TaskList({ tasks, hasGoals = true }: TaskListProps) {
  const taskList = tasks || [];
  const completedCount = taskList.filter((t) => t.status === 'completed').length;
  const totalCount = taskList.length;

  if (totalCount === 0) {
    if (!hasGoals) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center space-y-4">
          <div className="p-3.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-zinc-200">
              No active goals yet
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create your first goal to generate an AI execution roadmap and daily action tasks.
            </p>
          </div>
          <Link
            href="/goals/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg text-xs transition-all shadow-sm mt-2"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-950" />
            <span>Create Your First Goal</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-10 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center space-y-3">
        <div className="p-3 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-semibold text-zinc-200">
            All caught up for today
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You have no tasks scheduled for today. New tasks will unlock as you advance your active milestones.
          </p>
        </div>
      </div>
    );
  }

  // Group tasks by goalId for compact container rendering
  const goalGroupsMap = new Map<
    string,
    { goalId: string; goalTitle: string; tasks: TaskWithGoalMeta[] }
  >();

  for (const task of taskList) {
    const goalId = task.goalId;
    const goalTitle = task.goalTitle || 'Active Goal';

    if (!goalGroupsMap.has(goalId)) {
      goalGroupsMap.set(goalId, {
        goalId,
        goalTitle,
        tasks: [],
      });
    }

    goalGroupsMap.get(goalId)!.tasks.push(task);
  }

  const goalGroups = Array.from(goalGroupsMap.values());

  return (
    <section className="space-y-6" aria-label="Today's Scheduled Tasks">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Today&apos;s Focus
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {completedCount} / {totalCount} Completed
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {goalGroups.map((group) => {
          const groupCompleted = group.tasks.filter(
            (t) => t.status === 'completed'
          ).length;

          return (
            <div
              key={group.goalId}
              className="p-4 bg-zinc-950/80 border border-zinc-800/90 rounded-xl space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <Link
                  href={`/goals/${group.goalId}`}
                  className="flex items-center gap-2 group hover:text-white transition-colors min-w-0"
                >
                  <Target className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                  <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {group.goalTitle}
                  </h3>
                </Link>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded shrink-0">
                  {groupCompleted} / {group.tasks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
