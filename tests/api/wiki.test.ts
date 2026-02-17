import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWikiPages,
  fetchWikiPage,
  fetchAdminWikiPages,
  fetchAdminWikiPage,
  createWikiPage,
  updateWikiPage,
  deleteWikiPage,
} from '../../src/api/wiki.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

import { apiFetch } from '../../src/api/client.ts';

beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
});

describe('fetchWikiPages', () => {
  it('calls apiFetch with /api/wiki', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchWikiPages();
    expect(apiFetch).toHaveBeenCalledWith('/api/wiki');
    expect(result).toEqual([]);
  });
});

describe('fetchWikiPage', () => {
  it('calls apiFetch with /api/wiki/:slug', async () => {
    const page = { id: '1', slug: 'test', title: 'Test' };
    vi.mocked(apiFetch).mockResolvedValue(page);
    const result = await fetchWikiPage('test');
    expect(apiFetch).toHaveBeenCalledWith('/api/wiki/test');
    expect(result).toEqual(page);
  });
});

describe('fetchAdminWikiPages', () => {
  it('calls apiFetch with /api/admin/wiki', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchAdminWikiPages();
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/wiki');
    expect(result).toEqual([]);
  });
});

describe('fetchAdminWikiPage', () => {
  it('calls apiFetch with /api/admin/wiki/:slug', async () => {
    const page = { id: '1', slug: 'test' };
    vi.mocked(apiFetch).mockResolvedValue(page);
    const result = await fetchAdminWikiPage('test');
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/wiki/test');
    expect(result).toEqual(page);
  });
});

describe('createWikiPage', () => {
  it('calls apiFetch with POST and body', async () => {
    const data = { title: 'Test', slug: 'test', content: '# Hi', isPublished: true, showOnStart: false, sortOrder: 0 };
    vi.mocked(apiFetch).mockResolvedValue({ id: '1', ...data });
    const result = await createWikiPage(data);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/wiki', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    expect(result).toEqual({ id: '1', ...data });
  });
});

describe('updateWikiPage', () => {
  it('calls apiFetch with PUT and body', async () => {
    const data = { title: 'Updated', slug: 'test', content: '# Updated', isPublished: true, showOnStart: false, sortOrder: 0 };
    vi.mocked(apiFetch).mockResolvedValue({ id: '1', ...data });
    const result = await updateWikiPage('test', data);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/wiki/test', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    expect(result).toEqual({ id: '1', ...data });
  });
});

describe('deleteWikiPage', () => {
  it('calls apiFetch with DELETE', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);
    await deleteWikiPage('test');
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/wiki/test', { method: 'DELETE' });
  });
});
