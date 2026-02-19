import { useState, type JSX } from 'react';
import type { BrandVoiceThreadSummary } from '../../types/brandVoice.ts';

interface ThreadRailProps {
  readonly threads: readonly BrandVoiceThreadSummary[];
  readonly activeThreadId: string | null;
  readonly onSelectThread: (threadId: string) => void;
  readonly onDeleteThread: (threadId: string) => void;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ThreadRail({ threads, activeThreadId, onSelectThread, onDeleteThread }: ThreadRailProps): JSX.Element {
  const [search, setSearch] = useState('');

  const filteredThreads = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    : threads;

  return (
    <aside className="border-r border-outline-variant/20 py-3">
      <div className="mb-2 flex items-center gap-2 px-3">
        <h2 className="text-sm font-display font-semibold text-on-surface">Threads ({threads.length})</h2>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <input
            type="text"
            aria-label="Search threads"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            className="w-full rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 px-3 py-1.5 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => { setSearch(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/70 hover:text-on-surface"
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <div className="space-y-0.5 overflow-y-auto px-1">
        {filteredThreads.map((thread) => (
          <div key={thread.id} className="group relative">
            <button
              type="button"
              aria-pressed={activeThreadId === thread.id}
              onClick={() => { onSelectThread(thread.id); }}
              className={`w-full rounded-xl px-3 py-2 pr-8 text-left transition-colors ${
                activeThreadId === thread.id
                  ? 'bg-secondary-container/60 text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60'
              }`}
            >
              <span className="block line-clamp-2 text-sm">{thread.title}</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {thread.createdByEmail && (
                  <span className="text-xs text-on-surface-variant/70">
                    {thread.createdByEmail.split('@')[0]}
                  </span>
                )}
                {thread.createdByEmail && thread.createdAt && (
                  <span className="text-xs text-on-surface-variant/50" aria-hidden="true">&middot;</span>
                )}
                {thread.createdAt && (
                  <span className="text-xs text-on-surface-variant/50">
                    {formatRelativeDate(thread.createdAt)}
                  </span>
                )}
              </div>
            </button>
            <button
              type="button"
              aria-label="Delete thread"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this thread?')) {
                  onDeleteThread(thread.id);
                }
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant/50 opacity-0 transition-opacity hover:bg-error-container/30 hover:text-error group-hover:opacity-100"
            >
              &times;
            </button>
          </div>
        ))}
        {filteredThreads.length === 0 && threads.length > 0 && (
          <p className="px-3 py-4 text-center text-sm text-outline">
            No threads match your search.
          </p>
        )}
        {threads.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-outline">
            No threads yet. Start with your first prompt.
          </p>
        )}
      </div>
    </aside>
  );
}
