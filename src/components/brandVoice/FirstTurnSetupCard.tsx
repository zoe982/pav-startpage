import { useRef, useCallback, type JSX, type KeyboardEvent } from 'react';
import type { OutputStyle } from '../../types/brandVoice.ts';

const OUTPUT_STYLES: readonly { value: OutputStyle; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'document', label: 'Document' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
] as const;

interface FirstTurnSetupCardProps {
  readonly style: OutputStyle;
  readonly customStyleDescription: string;
  readonly goal: string;
  readonly roughDraft: string;
  readonly noDraftProvided: boolean;
  readonly isLoading: boolean;
  readonly onStyleChange: (style: OutputStyle) => void;
  readonly onCustomStyleDescriptionChange: (value: string) => void;
  readonly onGoalChange: (value: string) => void;
  readonly onRoughDraftChange: (value: string) => void;
  readonly onNoDraftProvidedChange: (value: boolean) => void;
  readonly onSubmit: () => Promise<void>;
}

export function FirstTurnSetupCard({
  style,
  customStyleDescription,
  goal,
  roughDraft,
  noDraftProvided,
  isLoading,
  onStyleChange,
  onCustomStyleDescriptionChange,
  onGoalChange,
  onRoughDraftChange,
  onNoDraftProvidedChange,
  onSubmit,
}: FirstTurnSetupCardProps): JSX.Element {
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = goal.trim().length > 0 && (roughDraft.trim().length > 0 || noDraftProvided);

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!canSubmit || isLoading) return;
    await onSubmit();
  }, [canSubmit, isLoading, onSubmit]);

  const handleGoalKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-3">
      {/* Style chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {OUTPUT_STYLES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={style === option.value}
            onClick={() => { onStyleChange(option.value); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              style === option.value
                ? 'bg-secondary-container text-on-secondary-container'
                : 'border border-outline-variant/40 bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {style === 'other' && (
        <input
          type="text"
          aria-label="Custom output style"
          value={customStyleDescription}
          placeholder="Describe the output style..."
          onChange={(event) => { onCustomStyleDescriptionChange(event.target.value); }}
          className="w-full rounded-lg bg-surface-container-high/40 px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
        />
      )}

      {/* Composer-style container */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[var(--shadow-elevation-1)]">
        {/* Draft area */}
        <div className="px-4 pt-3">
          <div className="mb-2 flex items-start gap-2">
            {noDraftProvided ? (
              <p className="flex-1 py-1 text-sm text-on-surface-variant/60">
                No draft provided —{' '}
                <button
                  type="button"
                  onClick={() => { onNoDraftProvidedChange(false); }}
                  className="underline hover:text-on-surface-variant"
                >
                  add draft
                </button>
              </p>
            ) : (
              <textarea
                aria-label="Rough draft"
                rows={2}
                value={roughDraft}
                onChange={(event) => {
                  onRoughDraftChange(event.target.value);
                  autoResize(event.target);
                }}
                placeholder="Quickly provide a rough draft..."
                className="max-h-48 flex-1 resize-none rounded-lg bg-surface-container-high/30 p-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            )}
            {!noDraftProvided && (
              <button
                type="button"
                onClick={() => {
                  onNoDraftProvidedChange(true);
                  onRoughDraftChange('');
                }}
                className="shrink-0 rounded-full px-2 py-1 text-xs text-on-surface-variant/60 hover:bg-surface-container-high/60 hover:text-on-surface-variant"
              >
                No draft
              </button>
            )}
          </div>
        </div>

        {/* Goal textarea + send icon */}
        <div className="flex items-end gap-2 px-4 pb-3">
          <textarea
            ref={goalRef}
            rows={1}
            aria-label="Goal"
            value={goal}
            placeholder="What do you want to write?"
            onChange={(event) => {
              onGoalChange(event.target.value);
              autoResize(event.target);
            }}
            onKeyDown={handleGoalKeyDown}
            className="max-h-40 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
          />
          <button
            type="button"
            aria-label="Generate draft"
            disabled={!canSubmit || isLoading}
            onClick={() => { void handleSubmit(); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 13V9.5L7 8L3 6.5V3L14 8L3 13Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
