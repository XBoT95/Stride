import type { Task } from '@/types';
import { TaskItem } from '@/components/tasks/TaskItem';
import { CheckCircle2, ListTodo, Target } from 'lucide-react';
import Link from 'next/link';

interface TaskWithGoalMeta extends Task {
  goalTitle?: string;
}

interface TaskListProps {
  tasks: TaskWithGoalMeta[] | null;
}

export function TaskList({ tasks }: TaskListProps) {
  const taskList = tasks || [];
  const completedCount = taskList.filter((t) => t.status === 'completed').length;
  const totalCount = taskList.length;

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center space-y-3">
        <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
          <ListTodo className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">
          No tasks scheduled for today.
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm">
          Create a new goal or complete your active milestone tasks to unlock your next daily actions.
        </p>
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
                  className="flex items-center gap-2 group hover:text-white transition-colors"
                >
                  <Target className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                  <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                    {group.goalTitle}
                  </h3>
                </Link>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
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
