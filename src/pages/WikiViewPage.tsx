import type { JSX } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { MarkdownPreview } from '../components/wiki/MarkdownPreview.tsx';
import { WikiNav } from '../components/wiki/WikiNav.tsx';
import { useWikiPage, useWikiPages } from '../hooks/useWiki.ts';

export function WikiViewPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const { page, isLoading, error } = useWikiPage(slug ?? '');
  const { pages } = useWikiPages();

  return (
    <AppShell>
      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <WikiNav pages={pages} />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <Link
              to="/wiki"
              className="text-sm text-pav-blue hover:text-pav-gold"
            >
              &larr; All pages
            </Link>
          </div>
          {isLoading && (
            <div className="space-y-3">
              <div className="h-8 w-48 animate-pulse rounded bg-pav-tan/30" />
              <div className="h-4 w-full animate-pulse rounded bg-pav-tan/30" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-pav-tan/30" />
            </div>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          {page && (
            <article>
              <h1 className="text-3xl font-bold text-pav-blue">
                {page.title}
              </h1>
              <div className="mt-6">
                <MarkdownPreview content={page.content} />
              </div>
            </article>
          )}
        </div>
      </div>
    </AppShell>
  );
}
