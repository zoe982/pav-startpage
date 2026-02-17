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

  const handleRename = async (): Promise<void> => {
    if (!activeThread) return;

    const nextTitle = titleInputRef.current?.value.trim() ?? '';
    if (!nextTitle || nextTitle === activeThread.title) return;

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

  const handleCopy = async (): Promise<void> => {
    if (!activeThread?.latestDraft) return;
    await navigator.clipboard.writeText(activeThread.latestDraft);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 1200);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">Brand Voice Chat</h1>
            <p className="text-sm text-on-surface-variant">
              Iterate with the assistant until the draft is ready.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewThread}
            className="rounded-full bg-pav-blue px-4 py-2 text-sm font-semibold text-on-primary"
          >
            New thread
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_1fr]">
          <aside className="rounded-2xl bg-surface p-4 ring-1 ring-outline-variant/40">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Threads</h2>
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => { void selectThread(thread.id); }}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm motion-standard ${
                    activeThread?.id === thread.id
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {thread.title}
                </button>
              ))}
              {threads.length === 0 && (
                <p className="text-sm text-outline">No threads yet.</p>
              )}
            </div>
          </aside>

          <section className="flex min-h-[520px] flex-col rounded-2xl bg-surface p-4 ring-1 ring-outline-variant/40">
            {activeThread && (
              <div className="mb-3 flex gap-2">
                <input
                  aria-label="Thread title"
                  key={activeThread.id}
                  ref={titleInputRef}
                  type="text"
                  defaultValue={activeThread.title}
                  className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => { void handleRename(); }}
                  className="rounded-full border border-outline px-4 py-2 text-sm text-on-surface-variant"
                >
                  Save title
                </button>
              </div>
            )}

            <div className="mb-4 flex-1 overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
              {!activeThread && (
                <p className="text-sm text-outline">Start a new conversation to generate your first draft.</p>
              )}

              {activeThread?.messages.length === 0 && (
                <p className="text-sm text-outline">No messages yet.</p>
              )}

              {(activeThread?.messages.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {activeThread?.messages.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        item.role === 'assistant'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {item.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('rewrite'); }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    mode === 'rewrite'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  Rewrite
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('draft'); }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    mode === 'draft'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  Draft
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {OUTPUT_STYLES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setStyle(option.value); }}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      style === option.value
                        ? 'border-secondary-container bg-secondary-container text-on-secondary-container'
                        : 'border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {style === 'other' && (
                <input
                  aria-label="Custom style"
                  type="text"
                  value={customStyleDescription}
                  onChange={(event) => { setCustomStyleDescription(event.target.value); }}
                  placeholder="Describe custom format"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                />
              )}

              <textarea
                aria-label="Message"
                value={message}
                onChange={(event) => { setMessage(event.target.value); }}
                rows={4}
                placeholder={activeThread ? 'Share feedback for the next revision...' : 'Describe what you want drafted...'}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="rounded-full bg-pav-blue px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </section>

          <section className="flex min-h-[520px] flex-col rounded-2xl bg-surface p-4 ring-1 ring-outline-variant/40">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-on-surface">Latest Draft</h2>
              <button
                type="button"
                onClick={() => { void handleCopy(); }}
                disabled={!activeThread?.latestDraft}
                className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant disabled:opacity-40"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="mb-3 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm whitespace-pre-wrap text-on-surface">
              {activeThread?.latestDraft ?? 'The latest draft will appear here.'}
            </div>

            <button
              type="button"
              onClick={() => { void pinActiveDraft(); }}
              disabled={!activeThread?.latestDraft || isLoading}
              className="rounded-full bg-secondary-container px-4 py-2 text-sm font-semibold text-on-secondary-container disabled:opacity-40"
            >
              Use this draft
            </button>

            {activeThread?.pinnedDraft && (
              <p className="mt-2 text-xs text-success">Draft pinned and ready to use.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
