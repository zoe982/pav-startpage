import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest } from '../../functions/_middleware.ts';
import { createMockContext, createMockD1 } from '../cf-helpers.ts';

describe('root middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through public auth paths', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/auth/login'),
    });
    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('passes through google-callback path', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('passes through non-API paths', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/about'),
    });
    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('returns 403 on CSRF origin mismatch for mutating requests', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/test', {
        method: 'POST',
        headers: { Origin: 'http://evil.com', Cookie: '__session=abc' },
      }),
    });
    const response = await onRequest(ctx);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'CSRF origin mismatch' });
  });

  it('returns 401 when no session cookie', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links'),
    });
    const response = await onRequest(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 401 when session is expired/invalid', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        headers: { Cookie: '__session=invalid-session' },
      }),
      env: { DB: db },
    });
    // first() returns null (no valid session found)
    const response = await onRequest(ctx);
    expect(response.status).toBe(401);
  });

  it('sets user on context.data for valid session', async () => {
    const userRow = {
      id: 'user-1',
      email: 'test@petairvalet.com',
      name: 'Test User',
      picture_url: 'https://pic.com/img.jpg',
      is_admin: 1,
    };
    const db = createMockD1(new Map([[
      `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
      userRow,
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        headers: { Cookie: '__session=valid-session' },
      }),
      env: { DB: db },
    });

    await onRequest(ctx);

    expect(ctx.data.user).toEqual({
      id: 'user-1',
      email: 'test@petairvalet.com',
      name: 'Test User',
      pictureUrl: 'https://pic.com/img.jpg',
      isAdmin: true,
      isInternal: true,
      appGrants: [],
    });
    expect(ctx.next).toHaveBeenCalled();
  });

  it('maps is_admin=0 to isAdmin false', async () => {
    const userRow = {
      id: 'user-1',
      email: 'test@petairvalet.com',
      name: 'Test',
      picture_url: null,
      is_admin: 0,
    };
    const db = createMockD1(new Map([[
      `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
      userRow,
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        headers: { Cookie: '__session=abc' },
      }),
      env: { DB: db },
    });

    await onRequest(ctx);
    expect(ctx.data.user.isAdmin).toBe(false);
  });

  it('allows mutating request when origin matches', async () => {
    const userRow = { id: 'u1', email: 'a@b.com', name: 'A', picture_url: null, is_admin: 0 };
    const db = createMockD1(new Map([[
      `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
      userRow,
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        method: 'POST',
        headers: { Cookie: '__session=abc', Origin: 'http://localhost:8788' },
      }),
      env: { DB: db },
    });

    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('returns 401 when cookie exists but has no __session value', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        headers: { Cookie: 'other=value' },
      }),
    });
    const response = await onRequest(ctx);
    expect(response.status).toBe(401);
  });

  it('allows GET requests without CSRF check', async () => {
    const userRow = { id: 'u1', email: 'a@b.com', name: 'A', picture_url: null, is_admin: 0 };
    const db = createMockD1(new Map([[
      `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
      userRow,
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/links', {
        headers: { Cookie: '__session=abc', Origin: 'http://evil.com' },
      }),
      env: { DB: db },
    });

    await onRequest(ctx);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('loads guest app grants for external users', async () => {
    const externalUser = {
      id: 'u2',
      email: 'external@example.com',
      name: 'External',
      picture_url: null,
      is_admin: 0,
    };
    const db = createMockD1(new Map([
      [[
        `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
      ].join(''), externalUser],
      ['SELECT app_key FROM guest_grants WHERE email = ?', [{ app_key: 'wiki' }, { app_key: 'templates' }]],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/wiki', {
        headers: { Cookie: '__session=abc' },
      }),
      env: { DB: db },
    });

    await onRequest(ctx);

    expect(ctx.next).toHaveBeenCalled();
    expect(ctx.data.user.isInternal).toBe(false);
    expect(ctx.data.user.appGrants).toEqual(['wiki', 'templates']);
  });
});
