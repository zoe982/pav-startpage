import type { JSX } from 'react';
import type { BrandVoiceDraftVersion } from '../../types/brandVoice.ts';

interface DraftVersionHistoryDialogProps {
  readonly open: boolean;
  readonly versions: readonly BrandVoiceDraftVersion[];
  readonly onClose: () => void;
  readonly onRestore: (versionId: string) => void;
  readonly isLoading: boolean;
}

export function DraftVersionHistoryDialog({
  open,
  versions,
  onClose,
  onRestore,
  isLoading,
}: DraftVersionHistoryDialogProps): JSX.Element | null {
  if (!open) return null;

  const newestVersionNumber = versions[0]?.versionNumber ?? null;

  return (
    <div role="dialog" aria-label="Draft version history" className="fixed inset-0 z-40 grid place-items-center bg-scrim/35 px-3">
      <div className="w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface p-5 shadow-[var(--shadow-elevation-3)]">
        <h3 className="text-xl font-semibold text-on-surface">Draft version history</h3>
        <div className="mt-4 space-y-2 text-sm text-on-surface">
          {versions.length === 0 && (
            <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-3 py-4 text-outline">
              No versions available yet.
            </p>
          )}
          {versions.map((version) => {
            const restoreDisabled = isLoading || version.versionNumber === newestVersionNumber;
            return (
              <article key={version.id} className="rounded-xl border border-outline-variant/70 bg-surface-container-low px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-on-surface">
                    {`v${version.versionNumber} · ${version.source}`}
                  </p>
                  <button
                    type="button"
                    disabled={restoreDisabled}
                    onClick={() => { onRestore(version.id); }}
                    className="rounded-full px-3 py-2 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {`Restore version ${version.versionNumber}`}
                  </button>
                </div>
                <p className="line-clamp-2 text-xs text-on-surface-variant">{version.draftText}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline px-4 py-2 text-sm text-on-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
