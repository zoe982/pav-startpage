import { useRef, useCallback, type JSX, type KeyboardEvent, type ChangeEvent } from 'react';

interface ComposerBarProps {
  readonly message: string;
  readonly isLoading: boolean;
  readonly onMessageChange: (value: string) => void;
  readonly onSubmit: () => Promise<void>;
}

function resetHeight(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function ComposerBar({
  message,
  isLoading,
  onMessageChange,
  onSubmit,
}: ComposerBarProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
    onMessageChange(event.target.value);
    resetHeight(event.target);
  }, [onMessageChange]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (isLoading || message.trim().length === 0) return;
    await onSubmit();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [isLoading, message, onSubmit]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 shadow-[var(--shadow-elevation-1)]">
      <textarea
        ref={textareaRef}
        rows={1}
        aria-label="Revision message"
        value={message}
        placeholder="Ask for a revision..."
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="max-h-40 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm text-on-surface outline-none"
      />
      <button
        type="button"
        aria-label="Send"
        disabled={isLoading || message.trim().length === 0}
        onClick={() => { void handleSubmit(); }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 13V9.5L7 8L3 6.5V3L14 8L3 13Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
