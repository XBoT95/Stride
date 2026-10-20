import type { GoalWithDetails } from '@/services/goal.service';
import type { PriorityLevel } from '@/types';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Calendar, Check, Flag, Layers, Lock } from 'lucide-react';

interface RoadmapTreeProps {
  goal: GoalWithDetails;
}

type DerivedMilestoneStatus = 'completed' | 'in_progress' | 'locked' | 'empty';

function MilestoneStatusBadge({ status }: { status: DerivedMilestoneStatus }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 font-medium shrink-0">
          <Check className="w-3 h-3" />
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-blue-800/60 bg-blue-950/40 text-blue-300 font-medium shrink-0">
          In Progress
        </span>
      );
    case 'locked':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 text-zinc-500 font-medium shrink-0">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      );
    case 'empty':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-500 font-medium shrink-0">
          No Tasks
        </span>
      );
  }
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const styles = {
    critical: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
    high: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
    medium: 'bg-blue-950/60 border-blue-800/80 text-blue-300',
    low: 'bg-zinc-900 border-zinc-800 text-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${styles[priority]}`}
    >
      <Flag className="w-3 h-3" />
      {priority}
    </span>
  );
}

export function RoadmapTree({ goal }: RoadmapTreeProps) {
  const sortedMilestones = [...(goal.milestones || [])].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder
  );

  const totalTasks = sortedMilestones.reduce(
    (acc, m) => acc + (m.tasks?.length || 0),
    0
  );
  const completedTasks = sortedMilestones.reduce(
    (acc, m) =>
      acc + (m.tasks?.filter((t) => t.status === 'completed').length || 0),
    0
  );

  // Derive active milestone: the earliest milestone containing at least one incomplete task.
  // If every milestone is complete, activeSequenceOrder is null and no milestones are locked.
  const activeMilestone = sortedMilestones.find((milestone) =>
    (milestone.tasks || []).some((task) => task.status !== 'completed')
  );
  const activeSequenceOrder = activeMilestone
    ? activeMilestone.sequenceOrder
    : null;

  return (
    <article className="space-y-8">
      {/* Goal Header Summary */}
      <header className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              {goal.title}
            </h1>
            {goal.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={goal.priority} />
            <span className="px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 capitalize">
              {goal.status}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-4">
          <div className="flex items-center gap-4">
            {goal.targetDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Target: {goal.targetDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              {sortedMilestones.length} Milestones
            </span>
          </div>

          <div className="font-mono text-zinc-300">
            {completedTasks} / {totalTasks} Tasks Completed
          </div>
        </div>
      </header>

      {/* Sequential Milestones & Interactive Tasks */}
      <section className="space-y-6" aria-label="Execution Roadmap">
        {sortedMilestones.map((milestone) => {
          const tasks = milestone.tasks || [];
          const hasTasks = tasks.length > 0;
          const isCompleted =
            hasTasks && tasks.every((t) => t.status === 'completed');
          const isLocked =
            activeSequenceOrder !== null &&
            milestone.sequenceOrder > activeSequenceOrder;

          const milestoneStatus: DerivedMilestoneStatus = !hasTasks
            ? 'empty'
            : isCompleted
              ? 'completed'
              : isLocked
                ? 'locked'
                : 'in_progress';

          return (
            <div
              key={milestone.id}
              className="p-5 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-4"
            >
              {/* Milestone Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-semibold text-zinc-300">
                      Milestone {milestone.sequenceOrder}
                    </span>
                    <h2 className="text-base font-semibold text-zinc-200">
                      {milestone.title}
                    </h2>
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-zinc-400 pl-0.5">
                      {milestone.description}
                    </p>
                  )}
                </div>
                <MilestoneStatusBadge status={milestoneStatus} />
              </div>

              {/* Milestone Tasks List with Interactive TaskItem Components */}
              <div className="space-y-2.5 pt-1">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} isLocked={isLocked} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </article>
  );
}
