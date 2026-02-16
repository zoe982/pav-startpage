import type { JSX } from 'react';
import { diffWords } from 'diff';

interface DiffViewProps {
  readonly original: string;
  readonly rewritten: string;
}

export function DiffView({ original, rewritten }: DiffViewProps): JSX.Element {
  const changes = diffWords(original, rewritten);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
      {changes.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="bg-success-container text-on-success-container rounded px-0.5">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-error-container text-on-error-container line-through rounded px-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}
