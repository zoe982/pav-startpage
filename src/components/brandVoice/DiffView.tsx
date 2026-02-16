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
            <span key={i} className="bg-green-100 text-green-800 rounded-sm px-0.5">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-red-100 text-red-800 line-through rounded-sm px-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}
