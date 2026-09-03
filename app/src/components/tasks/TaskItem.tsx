'use client';

import { useTransition } from 'react';
import { toggleTaskAction } from '@/app/goals/actions';
import type { Task } from '@/types';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = task.status === 'completed';

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTaskAction(task.id);
    });
  };

  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-zinc-950/60 border-zinc-900'
          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80'
      }`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={
          isCompleted
            ? `Mark task "${task.title}" as incomplete`
            : `Mark task "${task.title}" as completed`
        }
        aria-checked={isCompleted}
        role="checkbox"
        className="mt-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-600 rounded-full disabled:opacity-50 transition-opacity"
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-500 hover:text-zinc-300 transition-colors" />
        )}
      </button>

      {/* Task Content */}
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-sm font-medium leading-snug ${
              isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'
            }`}
          >
            {task.title}
          </span>
          {task.priority && (
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border shrink-0 ${
                task.priority === 'critical'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : task.priority === 'high'
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {task.priority}
            </span>
          )}
        </div>
        {task.description && (
          <p
            className={`text-xs leading-relaxed ${
              isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-400'
            }`}
          >
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}
