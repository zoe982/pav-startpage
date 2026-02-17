import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  onRequestGet,
  onRequestPut,
  onRequestDelete,
} from '../../../../functions/api/templates/[id]/index.ts';
import { createMockContext } from '../../../cf-helpers.ts';

function internalUser() {
  return {
    id: 'user-1',
    email: 'user@petairvalet.com',
    name: 'Test User',
    pictureUrl: null,
    isAdmin: false,
    isInternal: true,
    appGrants: [],
  } as const;
}

function deniedUser() {
  return {
    id: 'user-2',
    email: 'external@example.com',
    name: 'External User',
    pictureUrl: null,
    isAdmin: false,
    isInternal: false,
    appGrants: [],
  } as const;
}

function createPrepareMock(
  resolver: (query: string, boundValues: unknown[]) => {
    readonly first?: unknown;
    readonly all?: unknown[];
    readonly run?: unknown;
  },
) {
  return vi.fn((query: string) => {
    let boundValues: unknown[] = [];
    const bind = vi.fn((...values: unknown[]) => {
      boundValues = values;
      const resolved = resolver(query, boundValues);
      return {
        first: async () => (resolved.first ?? null),
        all: async () => ({ results: resolved.all ?? [] }),
        run: async () => (resolved.run ?? { success: true, results: [], meta: {} }),
      };
    });

    return {
      bind,
      first: vi.fn(async () => (resolver(query, boundValues).first ?? null)),
      all: vi.fn(async () => ({ results: resolver(query, boundValues).all ?? [] })),
      run: vi.fn(async () => (resolver(query, boundValues).run ?? { success: true, results: [], meta: {} })),
    };
  });
}

describe('GET /api/templates/:id', () => {
  it('returns forbidden without access', async () => {
    const ctx = createMockContext({
      params: { id: 'template-1' },
      data: { user: deniedUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 404 when template does not exist', async () => {
    const prepare = createPrepareMock(() => ({ first: null }));
    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'missing' },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
  });

  it('returns mapped template details', async () => {
    const prepare = createPrepareMock(() => ({
      first: {
        id: 'template-1',
        title: 'Welcome',
        type: 'email',
        subject: 'Hello',
        content: 'Hi',
        created_by: 'user-1',
        created_by_name: 'Test User',
        updated_by: 'user-1',
        updated_by_name: 'Test User',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    }));

    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({
      id: 'template-1',
      createdByName: 'Test User',
      updatedByName: 'Test User',
    }));
  });
});

describe('PUT /api/templates/:id', () => {
  const randomUuidSpy = vi.spyOn(crypto, 'randomUUID');

  beforeEach(() => {
    randomUuidSpy.mockReset();
  });

  it('returns forbidden without access', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Welcome', type: 'email', content: 'Hi' }),
      }),
      params: { id: 'template-1' },
      data: { user: deniedUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      }),
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', content: 'Hi' }),
      }),
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when type is invalid', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Welcome', type: 'sms', content: 'Hi' }),
      }),
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 404 when template does not exist', async () => {
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: null };
      }
      return {};
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/missing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Welcome', type: 'email', content: 'Hi' }),
      }),
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'missing' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(404);
  });

  it('returns 404 when updated row is not found after batch', async () => {
    randomUuidSpy.mockReturnValue('version-1' as ReturnType<typeof crypto.randomUUID>);
    const batch = vi.fn(async () => []);
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: { id: 'template-1' } };
      }
      if (query === 'SELECT MAX(version_number) AS max_ver FROM template_versions WHERE template_id = ?') {
        return { first: { max_ver: null } };
      }
      if (query.includes('WHERE t.id = ?')) {
        return { first: null };
      }
      return {};
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Welcome', type: 'email', content: 'Hi' }),
      }),
      env: { DB: { prepare, batch } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(404);
    expect(batch).toHaveBeenCalledTimes(1);
  });

  it('updates template and returns mapped response', async () => {
    randomUuidSpy.mockReturnValue('version-2' as ReturnType<typeof crypto.randomUUID>);
    const batch = vi.fn(async () => []);
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: { id: 'template-1' } };
      }
      if (query === 'SELECT MAX(version_number) AS max_ver FROM template_versions WHERE template_id = ?') {
        return { first: { max_ver: 5 } };
      }
      if (query.includes('WHERE t.id = ?')) {
        return {
          first: {
            id: 'template-1',
            title: 'Updated',
            type: 'whatsapp',
            subject: 'Hello',
            content: 'Hi there',
            created_by: 'user-1',
            created_by_name: 'Test User',
            updated_by: 'user-1',
            updated_by_name: 'Test User',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        };
      }
      return {};
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ' Updated ',
          type: 'whatsapp',
          subject: ' Hello ',
          content: 'Hi there',
        }),
      }),
      env: { DB: { prepare, batch } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(data).toEqual(expect.objectContaining({
      id: 'template-1',
      title: 'Updated',
      type: 'whatsapp',
      subject: 'Hello',
    }));
  });

  it('normalizes non-string optional fields on update', async () => {
    randomUuidSpy.mockReturnValue('version-3' as ReturnType<typeof crypto.randomUUID>);
    const batch = vi.fn(async () => []);
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: { id: 'template-1' } };
      }
      if (query === 'SELECT MAX(version_number) AS max_ver FROM template_versions WHERE template_id = ?') {
        return { first: { max_ver: 2 } };
      }
      if (query.includes('WHERE t.id = ?')) {
        return {
          first: {
            id: 'template-1',
            title: 'Updated',
            type: 'email',
            subject: null,
            content: '',
            created_by: 'user-1',
            created_by_name: 'Test User',
            updated_by: 'user-1',
            updated_by_name: 'Test User',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        };
      }
      return {};
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated',
          type: 'email',
          subject: 123,
          content: 456,
        }),
      }),
      env: { DB: { prepare, batch } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subject).toBeNull();
    expect(data.content).toBe('');
  });
});

describe('DELETE /api/templates/:id', () => {
  it('returns forbidden without access', async () => {
    const ctx = createMockContext({
      params: { id: 'template-1' },
      data: { user: deniedUser() },
    });
    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 404 when template does not exist', async () => {
    const prepare = createPrepareMock(() => ({ first: null }));
    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'missing' },
      data: { user: internalUser() },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(404);
  });

  it('deletes template when found', async () => {
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: { id: 'template-1' } };
      }
      return { run: { success: true, results: [], meta: {} } };
    });

    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(204);
  });
});
