import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { LinkGrid } from '../components/links/LinkGrid.tsx';
import { useLinks } from '../hooks/useLinks.ts';
import type { WikiPageSummary } from '../types/wiki.ts';
import { fetchWikiPages } from '../api/wiki.ts';

export function StartPage(): JSX.Element {
  const { links, isLoading: linksLoading } = useLinks();
  const [pinnedPages, setPinnedPages] = useState<WikiPageSummary[]>([]);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchWikiPages().then((pages) => {
      setPinnedPages(pages.filter((p) => p.showOnStart));
    });
  }, []);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearch('');
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredLinks = useMemo(() => {
    const sorted = [...links].sort((a, b) => a.title.localeCompare(b.title));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (link) =>
        link.title.toLowerCase().includes(q) ||
        (link.description?.toLowerCase().includes(q) ?? false),
    );
  }, [links, search]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <div className="mb-6">
            <div className="relative mx-auto max-w-xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pav-grey/40"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full rounded-xl border border-pav-tan/40 bg-white py-3.5 pl-12 pr-16 text-base text-pav-grey shadow-sm placeholder:text-pav-grey/40 transition focus:border-pav-gold focus:outline-none focus:ring-2 focus:ring-pav-gold/30"
              />
              {search ? (
                <button
                  onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-pav-grey/40 transition hover:bg-pav-tan/20 hover:text-pav-grey"
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-pav-tan/40 bg-pav-cream px-2 py-1 text-xs font-medium text-pav-grey/50">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-pav-blue">
            {search ? `Results for "${search}"` : 'Quick Links'}
          </h2>
          {linksLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-pav-tan/30"
                />
              ))}
            </div>
          ) : filteredLinks.length === 0 && search ? (
            <p className="mt-8 text-center text-sm text-pav-grey/50">
              No apps matching &ldquo;{search}&rdquo;
            </p>
          ) : (
            <div className="mt-4">
              <LinkGrid links={filteredLinks} />
            </div>
          )}
        </div>

        {pinnedPages.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-pav-blue">
              Pinned Wiki Pages
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {pinnedPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/wiki/${page.slug}`}
                  className="rounded-xl border border-pav-tan/30 bg-white p-5 shadow-sm transition hover:border-pav-gold hover:shadow-md"
                >
                  <h3 className="font-semibold text-pav-blue">{page.title}</h3>
                  <p className="mt-1 text-sm text-pav-grey/60">View page</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
