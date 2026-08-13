import { logoutAction } from '@/app/(auth)/actions';

interface UserNavProps {
  email: string;
  fullName?: string | null;
}

export function UserNav({ email, fullName }: UserNavProps) {
  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-tight text-white">
            Stride
          </span>
          <span className="text-xs text-zinc-500 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            v0.1 Beta
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col text-right">
            <span className="text-zinc-200 font-medium">
              {fullName || email}
            </span>
            <span className="text-zinc-500">{email}</span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-xs transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
