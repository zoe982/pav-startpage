import type { JSX } from 'react';
import { lazy, Suspense } from 'react';

const MDEditor = lazy(async () => import('@uiw/react-md-editor'));

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center rounded-md border border-outline-variant bg-surface-container/50">
          <span className="text-sm text-on-surface-variant">Loading editor...</span>
        </div>
      }
    >
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={(val) => {
            onChange(val ?? '');
          }}
          height={400}
        />
      </div>
    </Suspense>
  );
}
