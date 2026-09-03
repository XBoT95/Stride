'use client';

import { useActionState } from 'react';
import { createGoalAction } from '@/app/goals/actions';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

export function CreateGoalForm() {
  const [state, formAction, isPending] = useActionState(createGoalAction, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 p-4 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{state.error}</div>
        </div>
      )}

      {/* Goal Title */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-200"
        >
          Goal Title <span className="text-rose-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g. Build and Launch Stride MVP"
          className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-200"
        >
          Description{' '}
          <span className="text-zinc-500 font-normal">(Optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          disabled={isPending}
          placeholder="Provide context, constraints, or specific objectives for Gemini roadmap generation..."
          className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50 transition-colors resize-none"
        />
      </div>

      {/* Grid for Target Date and Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Target Date */}
        <div className="space-y-2">
          <label
            htmlFor="targetDate"
            className="block text-sm font-medium text-zinc-200"
          >
            Target Completion Date{' '}
            <span className="text-zinc-500 font-normal">(Optional)</span>
          </label>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50 transition-colors"
          />
        </div>

        {/* Priority Level */}
        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-zinc-200"
          >
            Priority Level
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50 transition-colors"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
            <span>Generating Execution Roadmap...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-zinc-900" />
            <span>Generate & Create Goal</span>
          </>
        )}
      </button>
    </form>
  );
}
