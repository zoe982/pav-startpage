import type { JSX } from 'react';
import { Link, useLocation } from 'react-router';
import type { WikiPageSummary } from '../../types/wiki.ts';

export function WikiNav({
  pages,
}: {
  readonly pages: readonly WikiPageSummary[];
}): JSX.Element {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {pages.map((page) => {
        const isActive = location.pathname === `/wiki/${page.slug}`;
        return (
          <Link
            key={page.id}
            to={`/wiki/${page.slug}`}
            className={`state-layer touch-target block rounded-xl px-3 py-2 text-sm motion-standard ${
              isActive
                ? 'bg-secondary-container font-medium text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {page.title}
          </Link>
        );
      })}
      {pages.length === 0 && (
        <p className="px-3 py-2 text-sm text-on-surface-variant">No pages yet.</p>
      )}
    </nav>
  );
}
