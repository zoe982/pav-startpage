import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../../functions/api/admin/guests/index.ts';
import { createMockContext } from '../../../../cf-helpers.ts';

function createDb(overrides: { readonly getRows?: unknown[] } = {}) {
  const prepare = vi.fn((query: string) => {
    const stmt = {
      bind: vi.fn(() => stmt),
      first: vi.fn(async () => null),
      all: vi.fn(async () => ({
        results: query.includes('FROM guest_grants') ? (overrides.getRows ?? []) : [],
      })),
      run: vi.fn(async () => ({ success: true, results: [], meta: {} })),
    };
    return stmt;
  });

  const batch = vi.fn(async () => []);
  return { prepare, batch };
}

describe('GET /api/admin/guests', () => {
  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      env: { DB: createDb() },
      data: { user: { isAdmin: false } },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('returns mapped guest grants for admins', async () => {
    const db = createDb({
      getRows: [
        {
          id: 'grant-1',
          email: 'guest@example.com',
          app_key: 'wiki',
          granted_by: 'user-1',
          granted_by_name: 'Admin User',
          created_at: '2026-02-17T00:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      env: { DB: db },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestGet(ctx);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual([
      {
        id: 'grant-1',
        email: 'guest@example.com',
        appKey: 'wiki',
        grantedBy: 'user-1',
        grantedByName: 'Admin User',
        createdAt: '2026-02-17T00:00:00.000Z',
      },
    ]);
  });
});

describe('POST /api/admin/guests', () => {
  const uuidSpy = vi.spyOn(crypto, 'randomUUID');

  beforeEach(() => {
    uuidSpy.mockReset();
  });

  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@example.com', appKeys: ['wiki'] }),
      }),
      data: { user: { isAdmin: false } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 400 for non-object request body', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid', appKeys: ['wiki'] }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Valid email is required' });
  });

  it('returns 400 when trying to add internal-domain users', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee@petairvalet.com', appKeys: ['wiki'] }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Cannot add grants for internal domain users' });
  });

  it('returns 400 when appKeys is missing or empty', async () => {
    const noArrayCtx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@example.com' }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const emptyArrayCtx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@example.com', appKeys: [] }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const firstResponse = await onRequestPost(noArrayCtx);
    const secondResponse = await onRequestPost(emptyArrayCtx);
    expect(firstResponse.status).toBe(400);
    expect(secondResponse.status).toBe(400);
  });

  it('returns 400 when app keys are not strings', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@example.com', appKeys: ['wiki', 123] }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'App keys must be strings' });
  });

  it('returns 400 when app keys include unsupported values', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@example.com', appKeys: ['wiki', 'unknown-app'] }),
      }),
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid app keys: unknown-app' });
  });

  it('creates guest grants for each app key', async () => {
    uuidSpy
      .mockReturnValueOnce('grant-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('grant-2' as ReturnType<typeof crypto.randomUUID>);

    const db = createDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'Guest@Example.com',
          appKeys: ['wiki', 'templates'],
        }),
      }),
      env: { DB: db },
      data: { user: { isAdmin: true, id: 'admin-1' } },
    });

    const response = await onRequestPost(ctx);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ success: true });
    expect(db.batch).toHaveBeenCalledTimes(1);
  });
});
