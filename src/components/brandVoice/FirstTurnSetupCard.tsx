import { useState, useRef, useCallback, type JSX, type KeyboardEvent } from 'react';
import type { BrandMode, OutputStyle } from '../../types/brandVoice.ts';

const OUTPUT_STYLES: readonly { value: OutputStyle; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'document', label: 'Document' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
] as const;

interface FirstTurnSetupCardProps {
  readonly mode: BrandMode;
  readonly style: OutputStyle;
  readonly customStyleDescription: string;
  readonly goal: string;
  readonly roughDraft: string;
  readonly noDraftProvided: boolean;
  readonly isLoading: boolean;
  readonly onModeChange: (mode: BrandMode) => void;
  readonly onStyleChange: (style: OutputStyle) => void;
  readonly onCustomStyleDescriptionChange: (value: string) => void;
  readonly onGoalChange: (value: string) => void;
  readonly onRoughDraftChange: (value: string) => void;
  readonly onNoDraftProvidedChange: (value: boolean) => void;
  readonly onSubmit: () => Promise<void>;
}

export function FirstTurnSetupCard({
  mode,
  style,
  customStyleDescription,
  goal,
  roughDraft,
  noDraftProvided,
  isLoading,
  onModeChange,
  onStyleChange,
  onCustomStyleDescriptionChange,
  onGoalChange,
  onRoughDraftChange,
  onNoDraftProvidedChange,
  onSubmit,
}: FirstTurnSetupCardProps): JSX.Element {
  const [isDraftExpanded, setIsDraftExpanded] = useState(false);
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
      {/* Mode + Style chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={mode === 'rewrite'}
          onClick={() => { onModeChange('rewrite'); }}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            mode === 'rewrite'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Rewrite
        </button>
        <button
          type="button"
          aria-pressed={mode === 'draft'}
          onClick={() => { onModeChange('draft'); }}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            mode === 'draft'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Draft
        </button>

        <span className="text-outline-variant" aria-hidden="true">|</span>

        {OUTPUT_STYLES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={style === option.value}
            onClick={() => { onStyleChange(option.value); }}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              style === option.value
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
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
        {/* Collapsible draft area */}
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => { setIsDraftExpanded(!isDraftExpanded); }}
            className="mb-2 text-xs text-primary hover:underline"
          >
            {isDraftExpanded || roughDraft.trim().length > 0 ? 'Draft attached' : 'Attach a rough draft'}
          </button>

          {(isDraftExpanded || roughDraft.trim().length > 0) && (
            <textarea
              aria-label="Rough draft"
              rows={4}
              value={roughDraft}
              onChange={(event) => { onRoughDraftChange(event.target.value); }}
              placeholder="Paste a rough draft..."
              className="mb-2 w-full resize-none rounded-lg bg-surface-container-high/30 p-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
            />
          )}
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

        {/* No draft checkbox footer */}
        <div className="flex items-center gap-2 border-t border-outline-variant/30 px-4 py-2">
          <input
            id="no-draft-toggle"
            type="checkbox"
            aria-label="No draft"
            checked={noDraftProvided}
            onChange={(event) => { onNoDraftProvidedChange(event.target.checked); }}
            className="h-3.5 w-3.5 rounded border-outline"
          />
          <label htmlFor="no-draft-toggle" className="text-xs text-on-surface-variant">
            No draft
          </label>
        </div>
      </div>
    </div>
  );
}
