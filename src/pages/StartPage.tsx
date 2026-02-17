import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { LinkGrid } from '../components/links/LinkGrid.tsx';
import { useLinks } from '../hooks/useLinks.ts';
import { useAppAccess } from '../hooks/useAppAccess.ts';
import type { AppKey } from '../types/auth.ts';
import type { WikiPageSummary } from '../types/wiki.ts';
import { fetchWikiPages } from '../api/wiki.ts';

interface InternalApp {
  readonly title: string;
  readonly description: string;
  readonly to: string;
  readonly icon: string;
  readonly key: AppKey;
}

const INTERNAL_APPS: InternalApp[] = [
  {
    title: 'Brand Voice',
    description: 'Rewrite or draft text in brand voice',
    to: '/brand-voice',
    key: 'brand-voice',
    icon: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
  },
  {
    title: 'Shared Templates',
    description: 'Email and WhatsApp message templates',
    to: '/templates',
    key: 'templates',
    icon: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  },
];

export function StartPage(): JSX.Element {
  const { links, isLoading: linksLoading } = useLinks();
  const { isInternal, hasAccess } = useAppAccess();
  const [pinnedPages, setPinnedPages] = useState<WikiPageSummary[]>([]);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const accessibleApps = useMemo(
    () => INTERNAL_APPS.filter((app) => hasAccess(app.key)),
    [hasAccess],
  );

  useEffect(() => {
    if (!hasAccess('wiki')) return;
    void fetchWikiPages().then((pages) => {
      setPinnedPages(pages.filter((p) => p.showOnStart));
    });
  }, [hasAccess]);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const filteredInternalApps = useMemo(() => {
    if (!search.trim()) return accessibleApps;
    const q = search.toLowerCase();
    return accessibleApps.filter(
      (app) =>
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q),
    );
  }, [search, accessibleApps]);

  const hasNoResults = search.trim().length > 0 && filteredLinks.length === 0 && filteredInternalApps.length === 0;

  return (
    <AppShell>
      <div className="animate-fade-up space-y-8">
        <div>
          <div className="mb-6">
            <div className="relative mx-auto max-w-xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder="Search apps..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3.5 pl-12 pr-16 text-base text-on-surface shadow-[var(--shadow-elevation-1)] placeholder:text-outline motion-standard focus-visible:border-pav-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-gold/30"
              />
              {search ? (
                <button
                  onClick={() => { setSearch(''); inputRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-outline motion-standard hover:bg-pav-tan/20 hover:text-on-surface"
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-pav-tan/40 bg-pav-cream px-2 py-1 text-xs font-medium text-outline">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Team Tools */}
          {filteredInternalApps.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-pav-blue">
                {search ? `Results for "${search}"` : 'Team Tools'}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredInternalApps.map((app) => (
                  <Link
                    key={app.to}
                    to={app.to}
                    className="state-layer group flex flex-col gap-2 rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-5 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pav-gold/15">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-pav-terra"
                          aria-hidden="true"
                        >
                          <path d={app.icon} />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-pav-blue group-hover:text-pav-terra">
                        {app.title}
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant">{app.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links — internal users only */}
          {isInternal && (!search || filteredLinks.length > 0) && (
            <>
              <h2 className="text-xl font-bold text-pav-blue">
                {search && filteredInternalApps.length > 0 ? 'Quick Links' : search ? `Results for "${search}"` : 'Quick Links'}
              </h2>
              {linksLoading ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="h-24 skeleton-shimmer rounded-xl"
                    />
                  ))}
                </div>
              ) : filteredLinks.length > 0 ? (
                <div className="mt-4">
                  <LinkGrid links={filteredLinks} />
                </div>
              ) : null}
            </>
          )}

          {hasNoResults && (
            <p className="mt-8 text-center text-sm text-outline">
              No apps matching &ldquo;{search}&rdquo;
            </p>
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
                  className="state-layer rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-5 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]"
                >
                  <h3 className="font-semibold text-pav-blue">{page.title}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">View page</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
