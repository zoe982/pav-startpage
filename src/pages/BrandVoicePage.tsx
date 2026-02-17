import type { JSX, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/layout/AppShell.tsx';
import { useBrandVoice } from '../hooks/useBrandVoice.ts';
import type { BrandMode, OutputStyle } from '../types/brandVoice.ts';

const OUTPUT_STYLES: { readonly value: OutputStyle; readonly label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'document', label: 'Document' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
];

export function BrandVoicePage(): JSX.Element {
  const {
    threads,
    activeThread,
    isLoading,
    error,
    loadThreads,
    selectThread,
    startThread,
    sendMessage,
    renameActiveThread,
    pinActiveDraft,
    clearActiveThread,
  } = useBrandVoice();

  const [mode, setMode] = useState<BrandMode>('draft');
  const [style, setStyle] = useState<OutputStyle>('email');
  const [customStyleDescription, setCustomStyleDescription] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const handleSend = async (event: SyntheticEvent): Promise<void> => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;

    if (activeThread) {
      await sendMessage(text, style, mode, customStyleDescription || undefined);
    } else {
      await startThread(text, style, mode, customStyleDescription || undefined);
    }

    setMessage('');
  };

  const handleRename = async (currentTitle: string): Promise<void> => {
    const nextTitle = titleInputRef.current!.value.trim();
    if (!nextTitle || nextTitle === currentTitle) return;

    await renameActiveThread(nextTitle);
  };

  const handleNewThread = (): void => {
    clearActiveThread();
    setMode('draft');
    setStyle('email');
    setCustomStyleDescription('');
    setMessage('');
    setCopied(false);
  };

  const latestDraft = activeThread?.latestDraft ?? '';

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(latestDraft);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 1200);
  };

  const hasMessages = (activeThread?.messages.length ?? 0) > 0;

  return (
    <AppShell>
      <div className="animate-fade-up space-y-5">
        <header className="rounded-3xl border border-outline-variant/50 bg-surface-container p-5 shadow-[var(--shadow-elevation-1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Brand Voice
              </p>
              <h1 className="font-display text-3xl font-semibold text-on-surface">Brand Voice Studio</h1>
              <p className="max-w-2xl text-sm text-on-surface-variant">
                Draft, refine, and pin final copy with one focused workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewThread}
              className="state-layer touch-target rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-[var(--shadow-elevation-1)] motion-standard hover:shadow-[var(--shadow-elevation-2)]"
            >
              New thread
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/25 bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => { void loadThreads(); }}
              disabled={isLoading}
              aria-label="Retry loading threads"
              className="state-layer touch-target rounded-full border border-on-error-container/25 px-4 py-1.5 text-xs font-semibold text-on-error-container motion-standard disabled:opacity-50"
            >
              Retry loading threads
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Threads</h2>
              <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
                {threads.length}
              </span>
            </div>
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => { void selectThread(thread.id); }}
                  className={`state-layer block w-full rounded-xl border px-3 py-2 text-left text-sm motion-standard ${
                    activeThread?.id === thread.id
                      ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                      : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                  }`}
                >
                  {thread.title}
                </button>
              ))}
              {threads.length === 0 && (
                <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-3 py-4 text-sm text-outline">
                  No threads yet. Start with your first prompt.
                </p>
              )}
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col gap-4 rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-on-surface">Conversation</h2>
              <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                {mode}
              </span>
            </div>

            {activeThread && (
              <div className="flex flex-wrap gap-2">
                <input
                  aria-label="Thread title"
                  key={activeThread.id}
                  ref={titleInputRef}
                  type="text"
                  defaultValue={activeThread.title}
                  className="min-w-[220px] flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-[var(--shadow-elevation-1)]"
                />
                <button
                  type="button"
                  onClick={() => { void handleRename(activeThread.title); }}
                  className="state-layer touch-target rounded-full border border-outline bg-surface-container px-4 py-2 text-sm text-on-surface-variant motion-standard hover:border-outline/80"
                >
                  Save title
                </button>
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3">
              {!activeThread && (
                <p className="text-sm text-outline">Start a new conversation to generate your first draft.</p>
              )}

              {activeThread?.messages.length === 0 && (
                <p className="text-sm text-outline">No messages yet.</p>
              )}

              {hasMessages && (
                <div className="space-y-2">
                  {activeThread?.messages.map((item) => (
                    <div
                      key={item.id}
                      className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                        item.role === 'assistant'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'ml-auto bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {item.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="space-y-3 rounded-2xl border border-outline-variant/70 bg-surface p-3 shadow-[var(--shadow-elevation-1)]">
              <h3 className="text-sm font-semibold text-on-surface">Compose request</h3>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">Mode</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-pressed={mode === 'rewrite'}
                    onClick={() => { setMode('rewrite'); }}
                    className={`state-layer touch-target rounded-full px-4 py-2 text-xs font-semibold motion-standard ${
                      mode === 'rewrite'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    Rewrite
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === 'draft'}
                    onClick={() => { setMode('draft'); }}
                    className={`state-layer touch-target rounded-full px-4 py-2 text-xs font-semibold motion-standard ${
                      mode === 'draft'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">Output style</p>
                <div className="flex flex-wrap gap-2">
                  {OUTPUT_STYLES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={style === option.value}
                      onClick={() => { setStyle(option.value); }}
                      className={`state-layer touch-target rounded-full border px-3 py-1.5 text-xs motion-standard ${
                        style === option.value
                          ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                          : 'border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {style === 'other' && (
                <input
                  aria-label="Custom style"
                  type="text"
                  value={customStyleDescription}
                  onChange={(event) => { setCustomStyleDescription(event.target.value); }}
                  placeholder="Describe custom format"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                />
              )}

              <textarea
                aria-label="Message"
                value={message}
                onChange={(event) => { setMessage(event.target.value); }}
                rows={4}
                placeholder={activeThread ? 'Share feedback for the next revision...' : 'Describe what you want drafted...'}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="state-layer touch-target rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-[var(--shadow-elevation-1)] motion-standard disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </section>

          <section className="flex min-h-[560px] flex-col rounded-3xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-[var(--shadow-elevation-1)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-on-surface">Latest Draft</h2>
              <button
                type="button"
                onClick={() => { void handleCopy(); }}
                disabled={!latestDraft}
                className="state-layer touch-target rounded-full border border-outline px-3 py-1 text-xs font-semibold text-on-surface-variant motion-standard disabled:opacity-40"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="mb-3 flex-1 whitespace-pre-wrap rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface">
              {latestDraft || 'The latest draft will appear here.'}
            </div>

            <button
              type="button"
              onClick={() => { void pinActiveDraft(); }}
              disabled={!latestDraft || isLoading}
              className="state-layer touch-target rounded-full bg-secondary-container px-4 py-2 text-sm font-semibold text-on-secondary-container motion-standard disabled:opacity-40"
            >
              Use this draft
            </button>

            {activeThread?.pinnedDraft && (
              <p className="mt-2 rounded-lg bg-success-container px-2 py-1 text-xs text-on-success-container">
                Draft pinned and ready to use.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
