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

function saveStatusColor(status: CanvasPanelProps['saveStatus']): string {
  switch (status) {
    case 'Unsaved':
      return 'text-on-surface-variant/70';
    case 'Saving':
      return 'text-on-surface-variant';
    case 'Saved':
      return 'text-primary';
    case 'Idle':
    default:
      return 'text-on-surface-variant/50';
  }
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
    <section className="flex min-h-0 flex-col bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-display font-semibold text-on-surface">Canvas</h2>
          <span className={`text-xs ${saveStatusColor(saveStatus)}`}>
            {saveStatusLabel(saveStatus)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className="state-layer touch-target rounded-lg px-2 py-1 text-xs text-primary hover:bg-surface-container-high/60" onClick={onOpenVersionHistory}>History</button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="state-layer touch-target rounded-lg px-2 py-1 text-xs text-on-surface hover:bg-surface-container-high/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => { void onCopy(); }}
            disabled={canvasText.length === 0 || isCopying}
            className="state-layer touch-target rounded-lg px-2 py-1 text-xs text-on-surface hover:bg-surface-container-high/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Copy
          </button>
          <button
            type="button"
            disabled={canvasText.length === 0 || isLoading}
            onClick={() => { void onPin(); }}
            className="state-layer touch-target rounded-lg px-2 py-1 text-xs text-on-surface hover:bg-surface-container-high/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pinnedDraft ? 'Pinned' : 'Pin draft'}
          </button>
          {pendingAssistantDraft && (
            <button
              type="button"
              onClick={onApplyAssistantUpdate}
              className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-on-primary"
            >
              Apply update
            </button>
          )}
        </div>
      </div>

      <textarea
        aria-label="Canvas draft"
        rows={18}
        value={canvasText}
        onChange={(event) => { onCanvasChange(event.target.value); }}
        className="flex-1 resize-none bg-transparent px-6 py-4 text-base leading-relaxed text-on-surface outline-none"
      />
    </section>
  );
}
