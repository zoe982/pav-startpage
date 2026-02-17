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
            className={`state-layer touch-target block rounded-md px-3 py-2 text-sm motion-standard ${
              isActive
                ? 'bg-pav-gold/20 font-medium text-pav-blue'
                : 'text-pav-grey hover:bg-pav-cream/50'
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
