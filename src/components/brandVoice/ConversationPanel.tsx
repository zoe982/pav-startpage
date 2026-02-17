import { useCallback, type JSX, type KeyboardEvent, type ReactNode } from 'react';
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

  return (
    <section className="flex flex-col bg-surface">
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
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-on-surface outline-none"
          />
          {contextLabel && (
            <span className="shrink-0 text-xs text-on-surface-variant/70">
              {contextLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto max-w-2xl">
          {!activeThread && (
            <p className="py-16 text-center text-sm text-outline">What would you like to write?</p>
          )}

          {activeThread?.messages.length === 0 && (
            <p className="py-16 text-center text-sm text-outline">What would you like to write?</p>
          )}

          {activeThread && activeThread.messages.length > 0 ? (
            <div className="space-y-1">
              {activeThread.messages.map((item) => (
                item.role === 'assistant' ? (
                  <div
                    key={item.id}
                    className="py-4 text-sm leading-relaxed text-on-surface"
                  >
                    {item.content}
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="ml-auto max-w-[85%] rounded-2xl bg-surface-container-high px-4 py-3 text-sm text-on-surface"
                  >
                    {item.content}
                  </div>
                )
              ))}
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
