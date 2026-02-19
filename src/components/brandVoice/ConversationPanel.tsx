import { useCallback, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import type { BrandVoiceThread } from '../../types/brandVoice.ts';

interface ConversationPanelProps {
  readonly activeThread: BrandVoiceThread | null;
  readonly isLoading: boolean;
  readonly onRenameThread: (title: string) => Promise<void>;
  readonly children: ReactNode;
}

export function ConversationPanel({
  activeThread,
  isLoading,
  onRenameThread,
  children,
}: ConversationPanelProps): JSX.Element {
  const handleTitleCommit = useCallback((input: HTMLInputElement, currentTitle: string): void => {
    const nextTitle = input.value.trim();
    if (!nextTitle || nextTitle === currentTitle) return;
    void onRenameThread(nextTitle);
  }, [onRenameThread]);

  const handleTitleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>, currentTitle: string): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTitleCommit(event.currentTarget, currentTitle);
    }
  }, [handleTitleCommit]);

  const modeLabel = activeThread?.mode ? activeThread.mode.charAt(0).toUpperCase() + activeThread.mode.slice(1) : null;
  const styleLabel = activeThread?.style ? activeThread.style.charAt(0).toUpperCase() + activeThread.style.slice(1) : null;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-transparent border-r border-outline-variant/20">
      {activeThread && (
        <div className="flex items-center gap-3 px-6 py-3">
          <input
            aria-label="Thread title"
            type="text"
            name="thread-title"
            defaultValue={activeThread.title}
            key={activeThread.id}
            disabled={isLoading}
            onKeyDown={(event) => { handleTitleKeyDown(event, activeThread.title); }}
            onBlur={(event) => { handleTitleCommit(event.currentTarget, activeThread.title); }}
            className="min-w-0 flex-1 bg-transparent text-base font-display font-semibold text-on-surface outline-none hover:border-b hover:border-outline-variant/30"
          />
          {modeLabel && (
            <span className="shrink-0 bg-secondary-container/50 text-on-secondary-container rounded-full px-2.5 py-0.5 text-xs font-medium">
              {modeLabel}
            </span>
          )}
          {styleLabel && (
            <span className="shrink-0 bg-secondary-container/50 text-on-secondary-container rounded-full px-2.5 py-0.5 text-xs font-medium">
              {styleLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {!activeThread && (
            <div className="py-16 text-center">
              <p className="text-lg font-display text-on-surface-variant">What would you like to write?</p>
              <p className="mt-2 text-sm text-on-surface-variant/70">Start a new thread to draft or rewrite content in PAV&apos;s brand voice.</p>
            </div>
          )}

          {activeThread?.messages.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-lg font-display text-on-surface-variant">What would you like to write?</p>
              <p className="mt-2 text-sm text-on-surface-variant/70">Start a new thread to draft or rewrite content in PAV&apos;s brand voice.</p>
            </div>
          )}

          {activeThread && activeThread.messages.length > 0 ? (
            <div className="space-y-3">
              {activeThread.messages.map((item) => (
                item.role === 'assistant' ? (
                  <div
                    key={item.id}
                    className="rounded-2xl rounded-tl-md bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface shadow-sm"
                  >
                    {item.content}
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="ml-auto max-w-[85%] rounded-2xl bg-primary/10 px-4 py-3 text-sm text-on-surface"
                  >
                    {item.content}
                  </div>
                )
              ))}
              {isLoading && (
                <div className="rounded-2xl rounded-tl-md bg-surface-container-low px-4 py-3 shadow-sm">
                  <div className="typing-indicator text-on-surface-variant" aria-label="Generating response">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-outline-variant/30 px-6 pb-4 pt-3">
        <div className="mx-auto max-w-2xl">
          {children}
        </div>
      </div>
    </section>
  );
}
