import type { JSX } from 'react';
import { useState } from 'react';

interface CopyButtonProps {
  readonly text: string;
  readonly className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className ?? `rounded-md px-3 py-1 text-xs font-medium motion-standard ${
        copied
          ? 'bg-success-container text-on-success-container'
          : 'text-on-surface-variant hover:bg-pav-tan/20'
      }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
