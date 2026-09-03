import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthService } from '@/services/auth.service';
import { UserNav } from '@/components/layout/UserNav';
import { CreateGoalForm } from '@/components/goals/CreateGoalForm';
import { ArrowLeft, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create Goal — Stride',
  description: 'Generate an AI execution roadmap and daily tasks for your goal.',
};

export default async function NewGoalPage() {
  const user = await AuthService.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await AuthService.getProfile();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <UserNav email={user.email!} fullName={profile?.full_name} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
              <Target className="w-3.5 h-3.5 text-zinc-400" />
              Goal Execution Engine
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create a New Goal
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Describe your objective below. Stride will automatically generate a sequential milestone roadmap and scheduled action tasks.
            </p>
          </div>
        </div>

        <div className="p-6 bg-zinc-950 border border-zinc-800/90 rounded-xl shadow-sm">
          <CreateGoalForm />
        </div>
      </main>
    </div>
  );
}
