import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../../functions/api/auth/logout.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('POST /api/auth/logout', () => {
  it('deletes session and clears cookie when session exists', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: '__session=session-123' },
      }),
      env: { DB: db },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(204);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect(db.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE id = ?');
  });

  it('returns 204 even without session cookie', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/auth/logout', {
        method: 'POST',
      }),
      env: { DB: db },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(204);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('returns 204 when Cookie header exists but has no __session', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: 'other=value' },
      }),
      env: { DB: db },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(204);
    // No DELETE should be called since there's no session
    expect(db.prepare).not.toHaveBeenCalled();
  });
});
