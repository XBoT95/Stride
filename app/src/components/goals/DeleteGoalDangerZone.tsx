'use client';

import { useState, useTransition, useEffect } from 'react';
import { deleteGoalAction } from '@/app/goals/actions';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteGoalDangerZoneProps {
  goalId: string;
  goalTitle: string;
}

export function DeleteGoalDangerZone({
  goalId,
  goalTitle,
}: DeleteGoalDangerZoneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Close dialog on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending]);

  const handleConfirmDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteGoalAction(goalId);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <section className="mt-12 pt-8 border-t border-rose-950/60 space-y-4">
      <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-rose-200 tracking-wide uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Danger Zone
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Permanently delete this goal, including all associated milestones and tasks. This action cannot be undone.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-lg text-xs font-semibold text-rose-200 hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          Delete Goal
        </button>
      </div>

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md p-6 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800/80 text-xs font-medium text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                Confirm Permanent Deletion
              </div>
              <h4
                id="delete-dialog-title"
                className="text-lg font-bold text-white tracking-tight"
              >
                Delete &quot;{goalTitle}&quot;?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will permanently delete{' '}
                <strong className="text-zinc-200">{goalTitle}</strong> and all of
                its associated milestones and tasks. This action cannot be undone.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Goal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
