import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthService } from '@/services/auth.service';
import { GoalService } from '@/services/goal.service';
import { UserNav } from '@/components/layout/UserNav';
import { RoadmapTree } from '@/components/goals/RoadmapTree';
import { DeleteGoalDangerZone } from '@/components/goals/DeleteGoalDangerZone';
import { ArrowLeft, Plus } from 'lucide-react';

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GoalDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { goal } = await GoalService.getGoal(id);

  if (!goal) {
    return {
      title: 'Goal Not Found — Stride',
    };
  }

  return {
    title: `${goal.title} — Stride`,
    description: goal.description || 'Execution roadmap and action tasks',
  };
}

export default async function GoalDetailPage({ params }: GoalDetailPageProps) {
  const user = await AuthService.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const profile = await AuthService.getProfile();
  const { goal, error } = await GoalService.getGoal(id);

  if (error || !goal) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <UserNav email={user.email!} fullName={profile?.full_name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>

          <Link
            href="/goals/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Another Goal</span>
          </Link>
        </div>

        <RoadmapTree goal={goal} />

        <DeleteGoalDangerZone goalId={goal.id} goalTitle={goal.title} />
      </main>
    </div>
  );
}
