import type { JSX, SyntheticEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/layout/AppShell.tsx';
import { DiffView } from '../components/brandVoice/DiffView.tsx';
import { useRewrite } from '../hooks/useBrandVoice.ts';
import type { BrandMode, OutputStyle } from '../types/brandVoice.ts';

const OUTPUT_STYLES: { readonly value: OutputStyle; readonly label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'document', label: 'Document' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
];

const MODE_CONFIG: Record<BrandMode, { label: string; placeholder: string; buttonLabel: string }> = {
  rewrite: {
    label: 'Original Text',
    placeholder: 'Paste the text you want to rewrite in brand voice...',
    buttonLabel: 'Rewrite',
  },
  draft: {
    label: 'What do you need?',
    placeholder: 'Describe what you need, e.g. "Write a WhatsApp bio", "Create a welcome email for new clients"...',
    buttonLabel: 'Draft',
  },
};

function useAutoResize() {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { resize(); });

  return { ref, resize };
}

export function BrandVoicePage(): JSX.Element {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<OutputStyle>('email');
  const [mode, setMode] = useState<BrandMode>('rewrite');
  const [customStyleDescription, setCustomStyleDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const { result, isLoading, error, feedbackHistory, rewrite, refine, cancel, reset } = useRewrite();
  const [copied, setCopied] = useState(false);
  const { ref: textareaRef, resize } = useAutoResize();

  const config = MODE_CONFIG[mode];

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;
    await rewrite(text, style, mode, customStyleDescription || undefined);
  };

  const handleCopy = async (): Promise<void> => {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  const handleReset = (): void => {
    setText('');
    setCustomStyleDescription('');
    setFeedback('');
    reset();
    setCopied(false);
  };

  const handleModeChange = (newMode: BrandMode): void => {
    setMode(newMode);
    reset();
    setCopied(false);
    setFeedback('');
  };

  const handleRefine = async (): Promise<void> => {
    if (!feedback.trim()) return;
    const currentFeedback = feedback;
    setFeedback('');
    await refine(currentFeedback, style, mode, customStyleDescription || undefined);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">Brand Voice</h1>
            <p className="mt-1 font-serif text-sm italic text-on-surface-variant">
              {mode === 'rewrite'
                ? 'Paste text to rewrite it in Pet Air Valet\u2019s brand voice.'
                : 'Describe what you need and we\u2019ll draft it in brand voice.'}
            </p>
          </div>
          {/* Mode toggle — M3 segmented button */}
          <div className="flex shrink-0 gap-0.5 rounded-full bg-surface-container-high p-1 ring-1 ring-outline-variant">
            <button
              type="button"
              onClick={() => { handleModeChange('rewrite'); }}
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide motion-standard ${
                mode === 'rewrite'
                  ? 'bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Rewrite
            </button>
            <button
              type="button"
              onClick={() => { handleModeChange('draft'); }}
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide motion-standard ${
                mode === 'draft'
                  ? 'bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Input panel ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-3xl bg-surface p-6 shadow-[var(--shadow-elevation-2)] ring-1 ring-black/[0.04]">
            <label htmlFor="brand-input" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {config.label}
            </label>

            {/* M3 outlined text field — white bg, visible border, auto-expands */}
            <textarea
              ref={textareaRef}
              id="brand-input"
              value={text}
              onChange={(e) => { setText(e.target.value); resize(); }}
              placeholder={config.placeholder}
              maxLength={10000}
              className="min-h-[160px] resize-none overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-sm leading-relaxed text-on-surface motion-standard placeholder:text-outline focus-visible:border-pav-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-blue/30"
            />

            {/* Style selector — M3 filter chips */}
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Output Style</legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {OUTPUT_STYLES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setStyle(opt.value); }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold motion-standard ${
                      style === opt.value
                        ? 'border-secondary-container bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface-container'
                    }`}
                  >
                    {style === opt.value && (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Custom style description */}
            {style === 'other' && (
              <input
                type="text"
                value={customStyleDescription}
                onChange={(e) => { setCustomStyleDescription(e.target.value); }}
                placeholder="Describe the format you want, e.g. 'Instagram caption'..."
                maxLength={500}
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface motion-standard placeholder:text-outline focus-visible:border-pav-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-blue/30"
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs tabular-nums text-outline">
                {text.length.toLocaleString()} / 10,000
              </span>
              <div className="flex gap-2">
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant motion-standard hover:bg-surface-container-high"
                  >
                    Clear
                  </button>
                )}
                {isLoading && (
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-full border border-outline px-4 py-2 text-sm font-medium text-on-surface-variant motion-standard hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className="state-layer rounded-full bg-pav-blue px-6 py-2.5 text-sm font-semibold text-on-primary shadow-[var(--shadow-elevation-3)] motion-standard hover:bg-pav-blue-hover hover:shadow-[var(--shadow-elevation-4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {isLoading ? `${config.buttonLabel === 'Draft' ? 'Drafting' : 'Rewriting'}\u2026` : config.buttonLabel}
                </button>
              </div>
            </div>
          </form>

          {/* ── Output panel ── */}
          <div className="flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-[var(--shadow-elevation-2)] ring-1 ring-black/[0.04]">
            {/* Header + copy */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Result</span>
              {result && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold motion-standard ${
                    copied
                      ? 'bg-success-container text-on-success-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Result area */}
            <div className="min-h-[300px] rounded-2xl border border-outline-variant bg-surface-container-lowest">
              {isLoading && (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-pav-blue/20 border-t-pav-blue" />
                  <button
                    type="button"
                    onClick={cancel}
                    className="text-xs font-medium text-on-surface-variant motion-standard hover:text-on-surface"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {error && (
                <div className="m-4 rounded-xl bg-error-container p-4 text-sm font-medium text-on-error-container ring-1 ring-error/20">
                  {error}
                </div>
              )}
              {result && !isLoading && (
                <div className="p-5 text-sm leading-relaxed whitespace-pre-wrap select-all text-on-surface">
                  {result.rewritten}
                </div>
              )}
              {!result && !isLoading && !error && (
                <p className="py-20 text-center text-sm text-outline">
                  {mode === 'rewrite'
                    ? 'Your rewritten text will appear here.'
                    : 'Your drafted content will appear here.'}
                </p>
              )}
            </div>

            {/* Feedback / Refinement */}
            {result && !isLoading && (
              <div className="flex flex-col gap-3">
                {feedbackHistory.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {feedbackHistory.map((fb, i) => (
                      <span key={i} className="rounded-full bg-surface-container-highest px-3 py-1 text-xs font-medium text-on-surface-variant">
                        {fb}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => { setFeedback(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { void handleRefine(); } }}
                    placeholder="Refine: 'Make it shorter', 'More formal'..."
                    maxLength={2000}
                    className="flex-1 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface motion-standard placeholder:text-outline focus-visible:border-pav-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-blue/30"
                  />
                  <button
                    type="button"
                    onClick={() => { void handleRefine(); }}
                    disabled={!feedback.trim()}
                    className="state-layer rounded-full bg-pav-blue px-5 py-2.5 text-sm font-semibold text-on-primary motion-standard hover:bg-pav-blue-hover hover:shadow-[var(--shadow-elevation-2)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Refine
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full-width diff section — only in rewrite mode */}
        {mode === 'rewrite' && result && !isLoading && (
          <div className="mt-6 rounded-3xl bg-surface p-6 shadow-[var(--shadow-elevation-2)] ring-1 ring-black/[0.04]">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Changes</h2>
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <DiffView original={result.original} rewritten={result.rewritten} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
