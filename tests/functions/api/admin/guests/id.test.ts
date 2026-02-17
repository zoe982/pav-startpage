import { describe, it, expect } from 'vitest';
import { onRequestDelete } from '../../../../../functions/api/admin/guests/[id].ts';
import { createMockContext, createMockD1 } from '../../../../cf-helpers.ts';

describe('DELETE /api/admin/guests/:id', () => {
  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      params: { id: 'grant-1' },
      data: { user: { isAdmin: false } },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 404 when grant does not exist', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      env: { DB: db },
      params: { id: 'missing-grant' },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Grant not found' });
  });

  it('deletes the grant when found', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM guest_grants WHERE id = ?', { id: 'grant-1' }],
    ]));
    const ctx = createMockContext({
      env: { DB: db },
      params: { id: 'grant-1' },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(204);
  });
});
