import type { JSX, ReactNode, SyntheticEvent } from 'react';
import type { BrandVoiceThread } from '../../types/brandVoice.ts';

interface ConversationPanelProps {
  readonly activeThread: BrandVoiceThread | null;
  readonly contextLabel: string | null;
  readonly isLoading: boolean;
  readonly onRenameThread: (title: string) => Promise<void>;
  readonly children: ReactNode;
}

export function ConversationPanel({
  activeThread,
  contextLabel,
  isLoading,
  onRenameThread,
  children,
}: ConversationPanelProps): JSX.Element {
  const handleRename = async (
    event: SyntheticEvent<HTMLFormElement>,
    currentTitle: string,
  ): Promise<void> => {
    event.preventDefault();

    const titleControl = event.currentTarget.elements.namedItem('thread-title');
    if (!(titleControl instanceof HTMLInputElement)) return;

    const nextTitle = titleControl.value.trim();
    if (!nextTitle || nextTitle === currentTitle) return;
    await onRenameThread(nextTitle);
  };

  return (
    <section className="flex min-h-[560px] flex-col gap-4 rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-on-surface">Conversation</h2>
        {contextLabel && (
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
            {contextLabel}
          </span>
        )}
      </div>

      {activeThread && (
        <form
          key={activeThread.id}
          className="flex flex-wrap gap-2"
          onSubmit={(event) => { void handleRename(event, activeThread.title); }}
        >
          <input
            aria-label="Thread title"
            type="text"
            name="thread-title"
            defaultValue={activeThread.title}
            className="min-w-[220px] flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full border border-outline px-4 py-2 text-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save title
          </button>
        </form>
      )}

      <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3">
        {!activeThread && (
          <p className="text-sm text-outline">Start a new conversation to generate your first draft.</p>
        )}

        {activeThread?.messages.length === 0 && (
          <p className="text-sm text-outline">No messages yet.</p>
        )}

        {activeThread && activeThread.messages.length > 0 ? (
          <div className="space-y-2">
            {activeThread.messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                  item.role === 'assistant'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'ml-auto bg-surface-container-high text-on-surface'
                }`}
              >
                {item.content}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  );
}
