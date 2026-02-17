import type { JSX } from 'react';

interface CanvasPanelProps {
  readonly canvasText: string;
  readonly saveStatus: 'Idle' | 'Unsaved' | 'Saving' | 'Saved';
  readonly pendingAssistantDraft: boolean;
  readonly canUndo: boolean;
  readonly isLoading: boolean;
  readonly isCopying: boolean;
  readonly pinnedDraft: string | null;
  readonly onCanvasChange: (value: string) => void;
  readonly onUndo: () => void;
  readonly onApplyAssistantUpdate: () => void;
  readonly onOpenVersionHistory: () => void;
  readonly onCopy: () => Promise<void>;
  readonly onPin: () => Promise<void>;
}

function saveStatusLabel(status: CanvasPanelProps['saveStatus']): string {
  switch (status) {
    case 'Unsaved':
      return 'Unsaved';
    case 'Saving':
      return 'Saving';
    case 'Saved':
      return 'Saved';
    case 'Idle':
    default:
      return 'Idle';
  }
}

export function CanvasPanel({
  canvasText,
  saveStatus,
  pendingAssistantDraft,
  canUndo,
  isLoading,
  isCopying,
  pinnedDraft,
  onCanvasChange,
  onUndo,
  onApplyAssistantUpdate,
  onOpenVersionHistory,
  onCopy,
  onPin,
}: CanvasPanelProps): JSX.Element {
  return (
    <section className="flex min-h-[560px] flex-col rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-on-surface">Canvas</h2>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant">
          {saveStatusLabel(saveStatus)}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-full px-3 py-2 text-sm text-primary" onClick={onOpenVersionHistory}>Version history</button>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-full border border-outline px-3 py-2 text-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          Undo edit
        </button>
        <button
          type="button"
          onClick={() => { void onCopy(); }}
          disabled={canvasText.length === 0 || isCopying}
          className="rounded-full border border-outline px-3 py-2 text-sm text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          Copy draft
        </button>
        {pendingAssistantDraft && (
          <button
            type="button"
            onClick={onApplyAssistantUpdate}
            className="rounded-full bg-primary px-3 py-2 text-sm font-medium text-on-primary"
          >
            Apply assistant update
          </button>
        )}
      </div>

      <textarea
        aria-label="Canvas draft"
        rows={18}
        value={canvasText}
        onChange={(event) => { onCanvasChange(event.target.value); }}
        className="mb-3 w-full flex-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface"
      />

      <button
        type="button"
        disabled={canvasText.length === 0 || isLoading}
        onClick={() => { void onPin(); }}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        Use this draft
      </button>

      {pinnedDraft && (
        <p className="mt-2 rounded-lg bg-success-container px-2 py-1 text-xs text-on-success-container">
          Draft pinned and ready to use.
        </p>
      )}
    </section>
  );
}
