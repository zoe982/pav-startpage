import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsers, updateAdminStatus } from '../../src/api/users.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/api/client.ts';

describe('users api', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('fetchUsers calls admin users endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue([{ id: 'user-1' }]);

    const result = await fetchUsers();

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/users');
    expect(result).toEqual([{ id: 'user-1' }]);
  });

  it('updateAdminStatus sends put request payload', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await updateAdminStatus('user-1', true);

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/users', {
      method: 'PUT',
      body: JSON.stringify({
        userId: 'user-1',
        isAdmin: true,
      }),
    });
  });
});
