import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWikiPages, useWikiPage } from '../../src/hooks/useWiki.ts';

vi.mock('../../src/api/wiki.ts', () => ({
  fetchWikiPages: vi.fn(),
  fetchWikiPage: vi.fn(),
}));

import { fetchWikiPages, fetchWikiPage } from '../../src/api/wiki.ts';

describe('useWikiPages', () => {
  beforeEach(() => {
    vi.mocked(fetchWikiPages).mockReset();
  });

  it('loads pages on mount', async () => {
    const pages = [{ id: '1', slug: 'test', title: 'Test', isPublished: true, showOnStart: false, sortOrder: 0 }];
    vi.mocked(fetchWikiPages).mockResolvedValue(pages);

    const { result } = renderHook(() => useWikiPages());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pages).toEqual(pages);
    expect(result.current.error).toBeNull();
  });

  it('sets error from Error instance', async () => {
    vi.mocked(fetchWikiPages).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useWikiPages());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Fetch failed');
  });

  it('sets fallback error for non-Error throws', async () => {
    vi.mocked(fetchWikiPages).mockRejectedValue(42);

    const { result } = renderHook(() => useWikiPages());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load wiki pages');
  });

  it('refresh re-fetches pages', async () => {
    vi.mocked(fetchWikiPages).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useWikiPages());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newPages = [{ id: '2', slug: 'new', title: 'New', isPublished: true, showOnStart: false, sortOrder: 0 }];
    vi.mocked(fetchWikiPages).mockResolvedValueOnce(newPages);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.pages).toEqual(newPages);
  });
});

describe('useWikiPage', () => {
  beforeEach(() => {
    vi.mocked(fetchWikiPage).mockReset();
  });

  it('loads page on mount', async () => {
    const page = { id: '1', slug: 'test', title: 'Test', content: '# Hi', isPublished: true, showOnStart: false, sortOrder: 0 };
    vi.mocked(fetchWikiPage).mockResolvedValue(page);

    const { result } = renderHook(() => useWikiPage('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.page).toEqual(page);
    expect(result.current.error).toBeNull();
  });

  it('sets error from Error instance', async () => {
    vi.mocked(fetchWikiPage).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useWikiPage('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Not found');
  });

  it('sets fallback error for non-Error throws', async () => {
    vi.mocked(fetchWikiPage).mockRejectedValue(null);

    const { result } = renderHook(() => useWikiPage('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load wiki page');
  });

  it('refresh re-fetches page', async () => {
    const page = { id: '1', slug: 'test', title: 'Test', content: '# Hi', isPublished: true, showOnStart: false, sortOrder: 0 };
    vi.mocked(fetchWikiPage).mockResolvedValueOnce(page);

    const { result } = renderHook(() => useWikiPage('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updated = { ...page, title: 'Updated' };
    vi.mocked(fetchWikiPage).mockResolvedValueOnce(updated);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.page).toEqual(updated);
  });
});
