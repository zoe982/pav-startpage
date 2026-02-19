import type { JSX } from 'react';
import { AppShell } from '../components/layout/AppShell.tsx';
import { WikiNav } from '../components/wiki/WikiNav.tsx';
import { useWikiPages } from '../hooks/useWiki.ts';

export function WikiListPage(): JSX.Element {
  const { pages, isLoading, error } = useWikiPages();

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-on-surface">Wiki</h1>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-surface-container"
              />
            ))}
          </div>
        )}
        {error && <p className="text-sm text-error">{error}</p>}
        {!isLoading && !error && <WikiNav pages={pages} />}
      </div>
    </AppShell>
  );
}
