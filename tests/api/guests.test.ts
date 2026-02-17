import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGuests, addGuest, removeGrant } from '../../src/api/guests.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/api/client.ts';

describe('guests api', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('fetchGuests calls admin guests endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue([{ id: 'grant-1' }]);

    const result = await fetchGuests();

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/guests');
    expect(result).toEqual([{ id: 'grant-1' }]);
  });

  it('addGuest posts email and app keys', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await addGuest('guest@example.com', ['wiki', 'templates']);

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/guests', {
      method: 'POST',
      body: JSON.stringify({
        email: 'guest@example.com',
        appKeys: ['wiki', 'templates'],
      }),
    });
  });

  it('removeGrant issues delete request', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);

    await removeGrant('grant-42');

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/guests/grant-42', { method: 'DELETE' });
  });
});
