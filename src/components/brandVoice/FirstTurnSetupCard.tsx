import type { JSX, SyntheticEvent } from 'react';
import type { BrandMode, OutputStyle } from '../../types/brandVoice.ts';

const OUTPUT_STYLES: readonly { value: OutputStyle; label: string }[] = [
  { value: 'email', label: 'Email style' },
  { value: 'whatsapp', label: 'WhatsApp style' },
  { value: 'document', label: 'Document style' },
  { value: 'instagram', label: 'Instagram style' },
  { value: 'facebook', label: 'Facebook style' },
  { value: 'other', label: 'Other style' },
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
  const canSubmit = goal.trim().length > 0 && (roughDraft.trim().length > 0 || noDraftProvided);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!canSubmit || isLoading) return;
    await onSubmit();
  };

  return (
    <form
      onSubmit={(event) => { void handleSubmit(event); }}
      className="space-y-4 rounded-2xl border border-outline-variant/70 bg-surface p-4 shadow-[var(--shadow-elevation-1)]"
    >
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-on-surface">First turn setup</h3>
        <p className="text-sm text-on-surface-variant">
          Define mode, output style, and goal before generating the first aligned draft.
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Mode</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={mode === 'rewrite'}
            onClick={() => { onModeChange('rewrite'); }}
            className={`rounded-full border px-4 py-2 text-xs font-medium ${
              mode === 'rewrite'
                ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface'
            }`}
          >
            Rewrite mode
          </button>
          <button
            type="button"
            aria-pressed={mode === 'draft'}
            onClick={() => { onModeChange('draft'); }}
            className={`rounded-full border px-4 py-2 text-xs font-medium ${
              mode === 'draft'
                ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface'
            }`}
          >
            Draft mode
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Output style</p>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_STYLES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={style === option.value}
              onClick={() => { onStyleChange(option.value); }}
              className={`rounded-full border px-4 py-2 text-xs font-medium ${
                style === option.value
                  ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {style === 'other' && (
        <input
          type="text"
          aria-label="Custom output style"
          value={customStyleDescription}
          onChange={(event) => { onCustomStyleDescriptionChange(event.target.value); }}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
        />
      )}

      <input
        type="text"
        aria-label="Goal"
        value={goal}
        onChange={(event) => { onGoalChange(event.target.value); }}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
      />

      <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant" htmlFor="first-turn-rough-draft">
        Rough draft
      </label>
      <textarea
        id="first-turn-rough-draft"
        aria-label="Rough draft"
        rows={6}
        value={roughDraft}
        onChange={(event) => { onRoughDraftChange(event.target.value); }}
        className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface"
        placeholder="Paste a rough draft or choose no draft available"
      />

      <label className="flex items-center gap-2 text-sm text-on-surface" htmlFor="no-draft-toggle">
        <input
          id="no-draft-toggle"
          type="checkbox"
          aria-label="No draft available"
          checked={noDraftProvided}
          onChange={(event) => { onNoDraftProvidedChange(event.target.checked); }}
          className="h-4 w-4 rounded border-outline"
        />
        No draft available
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Generate aligned draft
        </button>
      </div>
    </form>
  );
}
