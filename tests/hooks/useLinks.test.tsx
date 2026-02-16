import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLinks } from '../../src/hooks/useLinks.ts';

vi.mock('../../src/api/links.ts', () => ({
  fetchLinks: vi.fn(),
}));

import { fetchLinks } from '../../src/api/links.ts';

describe('useLinks', () => {
  beforeEach(() => {
    vi.mocked(fetchLinks).mockReset();
  });

  it('loads links on mount', async () => {
    const links = [{ id: '1', title: 'Test', url: 'https://test.com', description: null, iconUrl: null, sortOrder: 0, isVisible: true }];
    vi.mocked(fetchLinks).mockResolvedValue(links);

    const { result } = renderHook(() => useLinks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.links).toEqual(links);
    expect(result.current.error).toBeNull();
  });

  it('sets error message from Error instance', async () => {
    vi.mocked(fetchLinks).mockRejectedValue(new Error('Network fail'));

    const { result } = renderHook(() => useLinks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network fail');
    expect(result.current.links).toEqual([]);
  });

  it('sets fallback error for non-Error throws', async () => {
    vi.mocked(fetchLinks).mockRejectedValue('string error');

    const { result } = renderHook(() => useLinks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load links');
  });

  it('refresh re-fetches links', async () => {
    vi.mocked(fetchLinks).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useLinks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newLinks = [{ id: '2', title: 'New', url: 'https://new.com', description: null, iconUrl: null, sortOrder: 0, isVisible: true }];
    vi.mocked(fetchLinks).mockResolvedValueOnce(newLinks);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.links).toEqual(newLinks);
  });
});
