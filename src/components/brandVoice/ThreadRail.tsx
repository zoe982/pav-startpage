import type { JSX } from 'react';
import type { BrandVoiceThreadSummary } from '../../types/brandVoice.ts';

interface ThreadRailProps {
  readonly threads: readonly BrandVoiceThreadSummary[];
  readonly activeThreadId: string | null;
  readonly onSelectThread: (threadId: string) => void;
}

export function ThreadRail({ threads, activeThreadId, onSelectThread }: ThreadRailProps): JSX.Element {
  return (
    <aside className="border-r border-outline-variant/30 bg-surface-container-low py-3">
      <div className="mb-2 flex items-center gap-2 px-3">
        <h2 className="text-xs font-semibold text-on-surface-variant">Threads ({threads.length})</h2>
      </div>
      <div className="space-y-0.5 overflow-y-auto px-1">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            aria-pressed={activeThreadId === thread.id}
            onClick={() => { onSelectThread(thread.id); }}
            className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeThreadId === thread.id
                ? 'bg-surface-container-high font-medium text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container-high/60'
            }`}
          >
            {thread.title}
          </button>
        ))}
        {threads.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-outline">
            No threads yet. Start with your first prompt.
          </p>
        )}
      </div>
    </aside>
  );
}
