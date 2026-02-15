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
            className={`block rounded-md px-3 py-2 text-sm transition ${
              isActive
                ? 'bg-blue-100 font-medium text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page.title}
          </Link>
        );
      })}
      {pages.length === 0 && (
        <p className="px-3 py-2 text-sm text-gray-500">No pages yet.</p>
      )}
    </nav>
  );
}
