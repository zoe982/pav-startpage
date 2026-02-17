import type { JSX } from 'react';
import { useState } from 'react';

interface CopyButtonProps {
  readonly text: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function CopyButton({ text, className, disabled = false }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (disabled) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={className ?? `state-layer touch-target rounded-md px-3 py-2 text-xs font-medium motion-standard ${
        copied
          ? 'bg-success-container text-on-success-container'
          : 'text-on-surface-variant hover:bg-pav-tan/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
      }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
