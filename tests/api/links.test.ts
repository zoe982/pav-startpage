import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLinks,
  fetchAdminLinks,
  fetchAdminLink,
  createLink,
  updateLink,
  deleteLink,
} from '../../src/api/links.ts';

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

describe('fetchLinks', () => {
  it('calls apiFetch with /api/links', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchLinks();
    expect(apiFetch).toHaveBeenCalledWith('/api/links');
    expect(result).toEqual([]);
  });
});

describe('fetchAdminLinks', () => {
  it('calls apiFetch with /api/admin/links', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchAdminLinks();
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/links');
    expect(result).toEqual([]);
  });
});

describe('fetchAdminLink', () => {
  it('calls apiFetch with /api/admin/links/:id', async () => {
    const link = { id: '1', title: 'Test' };
    vi.mocked(apiFetch).mockResolvedValue(link);
    const result = await fetchAdminLink('1');
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/links/1');
    expect(result).toEqual(link);
  });
});

describe('createLink', () => {
  it('calls apiFetch with POST and body', async () => {
    const data = { title: 'Test', url: 'https://test.com', description: '', iconUrl: '', sortOrder: 0, isVisible: true };
    vi.mocked(apiFetch).mockResolvedValue({ id: '1', ...data });
    const result = await createLink(data);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    expect(result).toEqual({ id: '1', ...data });
  });
});

describe('updateLink', () => {
  it('calls apiFetch with PUT and body', async () => {
    const data = { title: 'Updated', url: 'https://test.com', description: '', iconUrl: '', sortOrder: 0, isVisible: true };
    vi.mocked(apiFetch).mockResolvedValue({ id: '1', ...data });
    const result = await updateLink('1', data);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/links/1', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    expect(result).toEqual({ id: '1', ...data });
  });
});

describe('deleteLink', () => {
  it('calls apiFetch with DELETE', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);
    await deleteLink('1');
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/links/1', { method: 'DELETE' });
  });
});
