import { describe, it, expect } from 'vitest';
import { onRequest } from '../../../../functions/api/admin/_middleware.ts';
import { createMockContext } from '../../../cf-helpers.ts';

describe('admin middleware', () => {
  it('allows admin users', async () => {
    const ctx = createMockContext({
      data: { user: { id: '1', email: 'admin@test.com', name: 'Admin', pictureUrl: null, isAdmin: true } },
    });
    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      data: { user: { id: '1', email: 'user@test.com', name: 'User', pictureUrl: null, isAdmin: false } },
    });
    const response = await onRequest(ctx);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Forbidden' });
  });
});
