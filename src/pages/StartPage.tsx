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
import {
  M3ElevatedCard,
  M3IconButton,
  M3OutlinedTextField,
  type MaterialTextFieldRef,
} from '../components/m3/material.tsx';

interface InternalApp {
  readonly title: string;
  readonly description: string;
  readonly to: string;
  readonly icon: string;
  readonly key: AppKey;
}

interface ExternalApp {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: string;
}

const EXTERNAL_APPS: ExternalApp[] = [
  {
    title: 'Humans',
    description: 'Customer relationship management',
    href: 'https://humans.pavinfo.app',
    icon: 'M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z',
  },
];

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

function isSearchFieldFocused(inputRef: MaterialTextFieldRef | null): boolean {
  return document.activeElement === inputRef || Boolean(inputRef?.shadowRoot?.activeElement);
}

export function StartPage(): JSX.Element {
  const { links, isLoading: linksLoading } = useLinks();
  const { isInternal, hasAccess } = useAppAccess();
  const [pinnedPages, setPinnedPages] = useState<WikiPageSummary[]>([]);
  const [search, setSearch] = useState('');
  const inputRef = useRef<MaterialTextFieldRef | null>(null);

  const accessibleApps = useMemo(
    () => INTERNAL_APPS.filter((app) => hasAccess(app.key)),
    [hasAccess],
  );

  useEffect(() => {
    if (!hasAccess('wiki')) return;
    let isMounted = true;
    void fetchWikiPages().then((pages) => {
      if (!isMounted) return;
      setPinnedPages(pages.filter((p) => p.showOnStart));
    });

    return () => {
      isMounted = false;
    };
  }, [hasAccess]);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && isSearchFieldFocused(inputRef.current)) {
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
    const query = search.toLowerCase();
    return sorted.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        (link.description?.toLowerCase().includes(query) ?? false),
    );
  }, [links, search]);

  const filteredInternalApps = useMemo(() => {
    if (!search.trim()) return accessibleApps;
    const query = search.toLowerCase();
    return accessibleApps.filter(
      (app) =>
        app.title.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query),
    );
  }, [search, accessibleApps]);

  const filteredExternalApps = useMemo(() => {
    if (!isInternal) return [];
    if (!search.trim()) return EXTERNAL_APPS;
    const query = search.toLowerCase();
    return EXTERNAL_APPS.filter(
      (app) =>
        app.title.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query),
    );
  }, [search, isInternal]);

  const hasNoResults = search.trim().length > 0 && filteredLinks.length === 0 && filteredInternalApps.length === 0 && filteredExternalApps.length === 0;

  return (
    <AppShell>
      <div className="animate-fade-up space-y-10">
        <div>
          <div className="mb-6">
            <div className="relative mx-auto max-w-xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <M3OutlinedTextField
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder="Search apps..."
                autoFocus
                ariaLabel="Search apps"
                className="touch-target w-full py-4 pl-12 pr-16 text-base text-on-surface"
                dataTestId="start-search-field"
              />
              {search ? (
                <M3IconButton
                  onClick={() => {
                    setSearch('');
                    inputRef.current?.focus();
                  }}
                  className="state-layer touch-target-icon absolute right-4 top-1/2 -translate-y-1/2 rounded-full text-on-surface-variant"
                  ariaLabel="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </M3IconButton>
              ) : (
                <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-outline-variant bg-surface-container px-2 py-1 text-xs font-medium text-on-surface-variant">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {(filteredInternalApps.length > 0 || filteredExternalApps.length > 0) && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold text-on-surface">
                {search ? `Results for "${search}"` : 'Team Tools'}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredInternalApps.map((app) => (
                  <M3ElevatedCard
                    key={app.to}
                    dataTestId={`internal-app-card-${app.key}`}
                    className="glass-card"
                  >
                    <Link
                      to={app.to}
                      className="state-layer group flex h-full flex-col gap-2 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5 text-on-secondary-container"
                            aria-hidden="true"
                          >
                            <path d={app.icon} />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-on-surface group-hover:text-tertiary">
                          {app.title}
                        </h3>
                      </div>
                      <p className="text-sm text-on-surface-variant">{app.description}</p>
                    </Link>
                  </M3ElevatedCard>
                ))}
                {filteredExternalApps.map((app) => (
                  <M3ElevatedCard
                    key={app.href}
                    dataTestId={`external-app-card-${app.title.toLowerCase()}`}
                    className="glass-card"
                  >
                    <a
                      href={app.href}
                      className="state-layer group flex h-full flex-col gap-2 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5 text-on-secondary-container"
                            aria-hidden="true"
                          >
                            <path d={app.icon} />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-on-surface group-hover:text-tertiary">
                          {app.title}
                        </h3>
                      </div>
                      <p className="text-sm text-on-surface-variant">{app.description}</p>
                    </a>
                  </M3ElevatedCard>
                ))}
              </div>
            </div>
          )}

          {isInternal && (!search || filteredLinks.length > 0) && (
            <>
              <h2 className="font-display text-xl font-semibold text-on-surface">
                {search && filteredInternalApps.length > 0 ? 'Quick Links' : search ? `Results for "${search}"` : 'Quick Links'}
              </h2>
              {linksLoading ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
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
            <p className="mt-8 text-center text-sm text-on-surface-variant">
              No apps matching &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        {pinnedPages.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-on-surface">
              Pinned Wiki Pages
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {pinnedPages.map((page) => (
                <M3ElevatedCard
                  key={page.id}
                  className="glass-card"
                >
                  <Link
                    to={`/wiki/${page.slug}`}
                    className="state-layer flex h-full flex-col rounded-2xl p-6"
                  >
                    <h3 className="font-semibold text-on-surface">{page.title}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">View page</p>
                  </Link>
                </M3ElevatedCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
