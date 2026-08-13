'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/(auth)/actions';

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4 w-full max-w-sm">
      {state?.error && (
        <div className="p-3 text-sm rounded bg-red-950/40 border border-red-800/60 text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@domain.com"
          className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm rounded-md transition-colors disabled:opacity-50"
      >
        {isPending ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="text-xs text-center text-zinc-400 pt-2">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-zinc-200 underline hover:text-white"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
