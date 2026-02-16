import type { JSX, SyntheticEvent } from 'react';
import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell.tsx';
import { DiffView } from '../components/brandVoice/DiffView.tsx';
import { useRewrite } from '../hooks/useBrandVoice.ts';
import type { BrandMode, OutputStyle } from '../types/brandVoice.ts';

const OUTPUT_STYLES: { readonly value: OutputStyle; readonly label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'document', label: 'Document' },
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
    placeholder: 'Describe what you need, e.g. "Write a WhatsApp bio", "Create a welcome email for new clients", "Draft an FAQ about our import documentation process"...',
    buttonLabel: 'Draft',
  },
};

export function BrandVoicePage(): JSX.Element {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<OutputStyle>('email');
  const [mode, setMode] = useState<BrandMode>('rewrite');
  const { result, isLoading, error, rewrite, reset } = useRewrite();
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const config = MODE_CONFIG[mode];

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;
    setShowDiff(false);
    await rewrite(text, style, mode);
  };

  const handleCopy = async (): Promise<void> => {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  const handleReset = (): void => {
    setText('');
    reset();
    setCopied(false);
    setShowDiff(false);
  };

  const handleModeChange = (newMode: BrandMode): void => {
    setMode(newMode);
    reset();
    setCopied(false);
    setShowDiff(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pav-blue">Brand Voice</h1>
            <p className="mt-1 text-sm text-pav-grey/60">
              {mode === 'rewrite'
                ? 'Paste text to rewrite it in Pet Air Valet\'s brand voice.'
                : 'Describe what you need and we\'ll draft it in brand voice.'}
            </p>
          </div>
          {/* Mode toggle */}
          <div className="flex shrink-0 gap-1 rounded-lg bg-pav-cream p-0.5">
            <button
              type="button"
              onClick={() => { handleModeChange('rewrite'); }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                mode === 'rewrite'
                  ? 'bg-white text-pav-blue shadow-sm'
                  : 'text-pav-grey hover:text-pav-blue'
              }`}
            >
              Rewrite
            </button>
            <button
              type="button"
              onClick={() => { handleModeChange('draft'); }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                mode === 'draft'
                  ? 'bg-white text-pav-blue shadow-sm'
                  : 'text-pav-grey hover:text-pav-blue'
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="brand-input" className="text-sm font-medium text-pav-grey">
              {config.label}
            </label>
            <textarea
              id="brand-input"
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              placeholder={config.placeholder}
              rows={mode === 'draft' ? 6 : 12}
              maxLength={10000}
              className="resize-y rounded-lg border border-pav-tan/30 bg-white p-4 text-sm shadow-sm focus:border-pav-gold focus:outline-none focus:ring-1 focus:ring-pav-gold"
            />

            {/* Style selector */}
            <fieldset>
              <legend className="text-sm font-medium text-pav-grey">Output Style</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {OUTPUT_STYLES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setStyle(opt.value); }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      style === opt.value
                        ? 'bg-pav-blue text-white'
                        : 'bg-pav-cream text-pav-grey hover:bg-pav-tan/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center justify-between">
              <span className="text-xs text-pav-grey/50">
                {text.length.toLocaleString()} / 10,000
              </span>
              <div className="flex gap-2">
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-md px-4 py-2 text-sm text-pav-grey/70 transition hover:bg-pav-tan/20"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className="rounded-md bg-pav-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-pav-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? `${config.buttonLabel === 'Draft' ? 'Drafting' : 'Rewriting'}...` : config.buttonLabel}
                </button>
              </div>
            </div>
          </form>

          {/* Output panel */}
          <div className="flex flex-col gap-3">
            {/* Tab bar + copy button */}
            <div className="flex items-center justify-between">
              {result && !isLoading ? (
                <div className="flex gap-1 rounded-lg bg-pav-cream p-0.5">
                  <button
                    type="button"
                    onClick={() => { setShowDiff(false); }}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      !showDiff
                        ? 'bg-white text-pav-blue shadow-sm'
                        : 'text-pav-grey hover:text-pav-blue'
                    }`}
                  >
                    Clean
                  </button>
                  {mode === 'rewrite' && (
                    <button
                      type="button"
                      onClick={() => { setShowDiff(true); }}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                        showDiff
                          ? 'bg-white text-pav-blue shadow-sm'
                          : 'text-pav-grey hover:text-pav-blue'
                      }`}
                    >
                      Changes
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-pav-grey">Result</span>
              )}
              {result && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    copied
                      ? 'bg-green-50 text-green-700'
                      : 'text-pav-grey/70 hover:bg-pav-tan/20'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Result area */}
            <div className="min-h-[300px] rounded-lg border border-pav-tan/30 bg-white shadow-sm">
              {isLoading && (
                <div className="flex h-full items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-pav-blue border-t-transparent" />
                </div>
              )}
              {error && (
                <div className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {result && !isLoading && !showDiff && (
                <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap select-all">
                  {result.rewritten}
                </div>
              )}
              {result && !isLoading && showDiff && (
                <div className="p-4">
                  <DiffView original={result.original} rewritten={result.rewritten} />
                </div>
              )}
              {!result && !isLoading && !error && (
                <p className="py-20 text-center text-sm text-pav-grey/40">
                  {mode === 'rewrite'
                    ? 'Your rewritten text will appear here.'
                    : 'Your drafted content will appear here.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
