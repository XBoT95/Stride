import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Stride
          </h1>
          <p className="text-xs text-zinc-400">
            Sign in to your execution engine
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
