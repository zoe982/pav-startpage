import type { JSX } from 'react';
import type { BrandVoiceThreadSummary } from '../../types/brandVoice.ts';

interface ThreadRailProps {
  readonly threads: readonly BrandVoiceThreadSummary[];
  readonly activeThreadId: string | null;
  readonly onSelectThread: (threadId: string) => void;
}

export function ThreadRail({ threads, activeThreadId, onSelectThread }: ThreadRailProps): JSX.Element {
  return (
    <aside className="rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Threads</h2>
        <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
          {threads.length}
        </span>
      </div>
      <div className="space-y-2">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            aria-pressed={activeThreadId === thread.id}
            onClick={() => { onSelectThread(thread.id); }}
            className={`w-full rounded-full border px-4 py-2 text-left text-sm ${
              activeThreadId === thread.id
                ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface'
            }`}
          >
            {thread.title}
          </button>
        ))}
        {threads.length === 0 && (
          <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-3 py-4 text-sm text-outline">
            No threads yet. Start with your first prompt.
          </p>
        )}
      </div>
    </aside>
  );
}
