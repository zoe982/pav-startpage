import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCurrentUser, logout } from '../../src/api/auth.ts';

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

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('calls apiFetch with /api/auth/me', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', pictureUrl: null, isAdmin: false };
    vi.mocked(apiFetch).mockResolvedValue(user);

    const result = await fetchCurrentUser();
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/me');
    expect(result).toEqual(user);
  });
});

describe('logout', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('calls apiFetch with POST /api/auth/logout', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);

    await logout();
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });
});
