import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';
import { useToast } from '../../hooks/useToast.ts';
import type { WikiPageSummary } from '../../types/wiki.ts';
import { fetchAdminWikiPages, deleteWikiPage } from '../../api/wiki.ts';

export function ManageWikiPage(): JSX.Element {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminWikiPages();
      setPages(data);
    } catch {
      addToast('Failed to load wiki pages', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const handleDelete = async (slug: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      await deleteWikiPage(slug);
      addToast('Page deleted', 'success');
      await loadPages();
    } catch {
      addToast('Failed to delete page', 'error');
    }
  };

  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Manage Wiki</h1>
            <Link
              to="/admin/wiki/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              New Page
            </Link>
          </div>

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-gray-200"
                  />
                ))}
              </div>
            ) : pages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No wiki pages yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {page.title}
                      </h3>
                      <p className="text-xs text-gray-500">/{page.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!page.isPublished && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                          Draft
                        </span>
                      )}
                      {page.showOnStart && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Pinned
                        </span>
                      )}
                      <Link
                        to={`/admin/wiki/${page.slug}/edit`}
                        className="rounded px-2 py-1 text-xs text-blue-600 transition hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => void handleDelete(page.slug)}
                        className="rounded px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
