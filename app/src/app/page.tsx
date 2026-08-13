import { redirect } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { UserNav } from '@/components/layout/UserNav';

export default async function DashboardPage() {
  const user = await AuthService.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await AuthService.getProfile();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <UserNav email={user.email!} fullName={profile?.full_name} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center">
        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Execution Engine Ready
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {profile?.full_name || 'Partner'}
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Your execution dashboard is authenticated. Next, we will connect Goal Creation and AI Roadmap generation.
          </p>
        </div>
      </main>
    </div>
  );
}
