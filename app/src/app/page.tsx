import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/services/auth.service';
import { TaskService } from '@/services/task.service';
import { GoalService } from '@/services/goal.service';
import { UserNav } from '@/components/layout/UserNav';
import { TaskList } from '@/components/tasks/TaskList';
import { ChevronRight, Plus, Target } from 'lucide-react';

export default async function DashboardPage() {
  const user = await AuthService.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await AuthService.getProfile();
  const { tasks: todayTasks } = await TaskService.getTodayTasks();
  const { goals } = await GoalService.getGoals();

  const activeGoals = (goals || []).filter((g) => g.status !== 'archived');

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <UserNav email={user.email!} fullName={profile?.full_name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-10">
        {/* Dashboard Header */}
        <section className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {profile?.full_name || 'Partner'}
            </h1>
            <p className="text-sm text-zinc-400">
              Here is your daily execution focus and active goal roadmap.
            </p>
          </div>

          <Link
            href="/goals/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>Create New Goal</span>
          </Link>
        </section>

        {/* Primary Execution Area: Today's Tasks */}
        <section className="space-y-6">
          <TaskList tasks={todayTasks} />
        </section>

        {/* Active Goals Overview */}
        {activeGoals.length > 0 && (
          <section className="space-y-4 pt-4">
            <header className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
                Active Goals ({activeGoals.length})
              </h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="p-4 bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl space-y-2 group transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                      {goal.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 mt-0.5" />
                  </div>

                  {goal.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span className="capitalize px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800/80">
                      {goal.priority} priority
                    </span>
                    {goal.targetDate && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-zinc-600" />
                        {goal.targetDate}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
