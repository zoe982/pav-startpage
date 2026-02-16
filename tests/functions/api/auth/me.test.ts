import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/auth/me.ts';
import { createMockContext } from '../../../cf-helpers.ts';

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test', pictureUrl: null, isAdmin: false };
    const ctx = createMockContext({ data: { user } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data).toEqual(user);
  });
});
