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
  const { result, isLoading, error, rewrite, cancel, reset } = useRewrite();
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
            <h1 className="text-2xl font-bold text-on-surface">Brand Voice</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {mode === 'rewrite'
                ? 'Paste text to rewrite it in Pet Air Valet\'s brand voice.'
                : 'Describe what you need and we\'ll draft it in brand voice.'}
            </p>
          </div>
          {/* Mode toggle — MD3 segmented button */}
          <div className="flex shrink-0 gap-1 rounded-full bg-surface-container p-1">
            <button
              type="button"
              onClick={() => { handleModeChange('rewrite'); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === 'rewrite'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Rewrite
            </button>
            <button
              type="button"
              onClick={() => { handleModeChange('draft'); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                mode === 'draft'
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input panel — MD3 surface card */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant shadow-sm">
            <label htmlFor="brand-input" className="text-sm font-medium text-on-surface">
              {config.label}
            </label>
            <textarea
              id="brand-input"
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              placeholder={config.placeholder}
              rows={mode === 'draft' ? 6 : 12}
              maxLength={10000}
              className="resize-y rounded-xl bg-surface-container p-4 text-sm text-on-surface shadow-none transition-all duration-200 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-pav-blue"
            />

            {/* Style selector — MD3 filter chips */}
            <fieldset>
              <legend className="text-sm font-medium text-on-surface">Output Style</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {OUTPUT_STYLES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setStyle(opt.value); }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium ring-1 transition-all duration-200 ${
                      style === opt.value
                        ? 'bg-secondary-container text-on-secondary-container ring-outline'
                        : 'bg-transparent text-on-surface-variant ring-outline-variant hover:bg-surface-container-high'
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

            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant/60">
                {text.length.toLocaleString()} / 10,000
              </span>
              <div className="flex gap-2">
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full px-4 py-2 text-sm text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high"
                  >
                    Clear
                  </button>
                )}
                {isLoading && (
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant ring-1 ring-outline transition-all duration-200 hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className="rounded-full bg-pav-blue px-5 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-pav-blue-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? `${config.buttonLabel === 'Draft' ? 'Drafting' : 'Rewriting'}...` : config.buttonLabel}
                </button>
              </div>
            </div>
          </form>

          {/* Output panel — MD3 surface card */}
          <div className="flex flex-col gap-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant shadow-sm">
            {/* Tab bar + copy button */}
            <div className="flex items-center justify-between">
              {result && !isLoading ? (
                <div className="flex gap-1 rounded-full bg-surface-container p-1">
                  <button
                    type="button"
                    onClick={() => { setShowDiff(false); }}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                      !showDiff
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Clean
                  </button>
                  {mode === 'rewrite' && (
                    <button
                      type="button"
                      onClick={() => { setShowDiff(true); }}
                      className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                        showDiff
                          ? 'bg-primary-container text-on-primary-container shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      Changes
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-on-surface">Result</span>
              )}
              {result && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-green-50 text-green-700'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Result area */}
            <div className="min-h-[300px] rounded-xl bg-surface-container">
              {isLoading && (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-pav-blue border-t-transparent" />
                  <button
                    type="button"
                    onClick={cancel}
                    className="text-xs text-on-surface-variant transition-all duration-200 hover:text-on-surface"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {error && (
                <div className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {result && !isLoading && !showDiff && (
                <div className="p-5 text-sm leading-relaxed whitespace-pre-wrap select-all text-on-surface">
                  {result.rewritten}
                </div>
              )}
              {result && !isLoading && showDiff && (
                <div className="p-5">
                  <DiffView original={result.original} rewritten={result.rewritten} />
                </div>
              )}
              {!result && !isLoading && !error && (
                <p className="py-20 text-center text-sm text-on-surface-variant/50">
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
