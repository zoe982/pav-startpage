import { useCallback, useEffect, useState } from 'react';
import type { WikiPage, WikiPageSummary } from '../types/wiki.ts';
import { fetchWikiPages, fetchWikiPage } from '../api/wiki.ts';

interface UseWikiPagesReturn {
  readonly pages: WikiPageSummary[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

interface UseWikiPageReturn {
  readonly page: WikiPage | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

export function useWikiPages(): UseWikiPagesReturn {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWikiPages();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wiki pages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { pages, isLoading, error, refresh } as const;
}

export function useWikiPage(slug: string): UseWikiPageReturn {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWikiPage(slug);
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wiki page');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { page, isLoading, error, refresh } as const;
}
