import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import type { TemplateVersion } from '../../types/template.ts';
import { fetchTemplateVersions } from '../../api/templates.ts';

interface VersionHistoryModalProps {
  readonly templateId: string;
  readonly onClose: () => void;
  readonly onRestore: (version: TemplateVersion) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function VersionHistoryModal({
  templateId,
  onClose,
  onRestore,
}: VersionHistoryModalProps): JSX.Element {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<TemplateVersion | null>(null);

  useEffect(() => {
    void fetchTemplateVersions(templateId).then((data) => {
      setVersions(data);
      if (data.length > 0) setSelected(data[0] ?? null);
      setIsLoading(false);
    });
  }, [templateId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40">
      <div className="mx-4 flex max-h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-surface-container-lowest shadow-[var(--shadow-elevation-4)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 className="text-lg font-bold text-primary">Version History</h2>
          <button
            type="button"
            onClick={onClose}
            className="state-layer touch-target-icon rounded-md p-2 text-outline motion-standard hover:bg-surface-container hover:text-on-surface"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-outline">No version history available.</p>
            </div>
          ) : (
            <>
              {/* Version list */}
              <div className="w-64 shrink-0 overflow-y-auto border-r border-outline-variant">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setSelected(v); }}
                    className={`state-layer touch-target w-full border-b border-outline-variant/60 px-4 py-2 text-left motion-standard ${
                      selected?.id === v.id
                        ? 'bg-secondary-container/50'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-sm font-medium text-primary">
                      v{v.versionNumber}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {v.changedByName}
                    </p>
                    <p className="text-xs text-outline">
                      {formatDate(v.createdAt)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {selected && (
                  <>
                    <div className="flex-1 overflow-y-auto p-6">
                      <h3 className="font-semibold text-primary">{selected.title}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                          selected.type === 'email'
                            ? 'bg-primary-container text-on-primary-container'
                            : selected.type === 'both'
                              ? 'bg-tertiary-container text-on-tertiary-container'
                              : 'bg-success-container text-on-success-container'
                        }`}>
                          {selected.type === 'both' ? 'Email + WA' : selected.type}
                        </span>
                      </div>
                      {(selected.type === 'email' || selected.type === 'both') && selected.subject && (
                        <p className="mt-2 text-sm text-on-surface-variant">
                          <span className="font-medium">Subject:</span> {selected.subject}
                        </p>
                      )}
                      <div className="mt-4 whitespace-pre-wrap text-sm text-on-surface">
                        {selected.content}
                      </div>
                    </div>
                    {/* Restore button - don't show for latest version */}
                    {selected.versionNumber !== versions[0]?.versionNumber && (
                      <div className="border-t border-outline-variant px-6 py-3">
                        <button
                          type="button"
                          onClick={() => { onRestore(selected); }}
                          className="state-layer touch-target rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-primary/90"
                        >
                          Restore this version
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
