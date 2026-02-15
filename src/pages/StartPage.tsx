import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { LinkGrid } from '../components/links/LinkGrid.tsx';
import { useLinks } from '../hooks/useLinks.ts';
import type { WikiPageSummary } from '../types/wiki.ts';
import { fetchWikiPages } from '../api/wiki.ts';

export function StartPage(): JSX.Element {
  const { links, isLoading: linksLoading } = useLinks();
  const [pinnedPages, setPinnedPages] = useState<WikiPageSummary[]>([]);

  useEffect(() => {
    void fetchWikiPages().then((pages) => {
      setPinnedPages(pages.filter((p) => p.showOnStart));
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Links</h1>
          {linksLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <LinkGrid links={links} />
            </div>
          )}
        </div>

        {pinnedPages.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pinned Wiki Pages
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {pinnedPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/wiki/${page.slug}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <h3 className="font-semibold text-gray-900">{page.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">View page</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
