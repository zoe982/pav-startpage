import { describe, it, expect, vi } from 'vitest';
import { onRequestGet, onRequestPut } from '../../../../../functions/api/admin/users/index.ts';
import { createMockContext } from '../../../../cf-helpers.ts';

function createUsersDb(options: {
  readonly usersRows?: unknown[];
  readonly userExists?: boolean;
} = {}) {
  const prepare = vi.fn((query: string) => {
    let boundValues: unknown[] = [];
    const stmt = {
      bind: vi.fn((...values: unknown[]) => {
        boundValues = values;
        return stmt;
      }),
      first: vi.fn(async () => {
        if (query.includes('SELECT id FROM users WHERE id = ?')) {
          return options.userExists ? { id: boundValues[0] as string } : null;
        }
        return null;
      }),
      all: vi.fn(async () => ({
        results: query.includes('FROM users ORDER BY name ASC') ? (options.usersRows ?? []) : [],
      })),
      run: vi.fn(async () => ({ success: true, results: [], meta: {} })),
    };
    return stmt;
  });

  return { prepare, batch: vi.fn(async () => []) };
}

describe('GET /api/admin/users', () => {
  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      env: { DB: createUsersDb() },
      data: { user: { isAdmin: false } },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('returns mapped users for admins', async () => {
    const db = createUsersDb({
      usersRows: [
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin',
          picture_url: 'https://img.example.com/avatar.png',
          is_admin: 1,
        },
        {
          id: 'user-2',
          email: 'member@example.com',
          name: 'Member',
          picture_url: null,
          is_admin: 0,
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
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin',
        pictureUrl: 'https://img.example.com/avatar.png',
        isAdmin: true,
      },
      {
        id: 'user-2',
        email: 'member@example.com',
        name: 'Member',
        pictureUrl: null,
        isAdmin: false,
      },
    ]);
  });
});

describe('PUT /api/admin/users', () => {
  it('returns 403 for non-admin users', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', isAdmin: true }),
      }),
      data: { user: { isAdmin: false } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 400 when request body is missing required fields', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '', isAdmin: 'yes' }),
      }),
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'userId and isAdmin are required' });
  });

  it('returns 404 when user does not exist', async () => {
    const db = createUsersDb({ userExists: false });
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'missing-user', isAdmin: true }),
      }),
      env: { DB: db },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('updates admin status and returns success', async () => {
    const db = createUsersDb({ userExists: true });
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', isAdmin: true }),
      }),
      env: { DB: db },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('writes 0 when revoking admin status', async () => {
    const db = createUsersDb({ userExists: true });
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', isAdmin: false }),
      }),
      env: { DB: db },
      data: { user: { isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
