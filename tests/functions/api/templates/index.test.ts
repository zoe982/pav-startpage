import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../functions/api/templates/index.ts';
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

function externalUserWithoutTemplatesAccess() {
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

function createTemplateDb(
  options: {
    readonly allResults?: unknown[];
  } = {},
) {
  const prepare = vi.fn((query: string) => {
    let boundValues: unknown[] = [];
    return {
      bind: vi.fn((...values: unknown[]) => {
        boundValues = values;
        return {
          all: async () => ({ results: options.allResults ?? [] }),
          first: async () => null,
          run: async () => ({ success: true, meta: {}, results: [] }),
        };
      }),
      all: vi.fn(async () => ({ results: options.allResults ?? [] })),
      first: vi.fn(async () => null),
      run: vi.fn(async () => ({ success: true, meta: {}, results: [] })),
      __query: query,
      __boundValues: () => boundValues,
    };
  });

  const batch = vi.fn(async () => []);

  return { prepare, batch };
}

describe('GET /api/templates', () => {
  it('returns forbidden for users without templates access', async () => {
    const ctx = createMockContext({
      data: { user: externalUserWithoutTemplatesAccess() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('returns templates without filter', async () => {
    const db = createTemplateDb({
      allResults: [
        {
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
      ],
    });
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates'),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      expect.objectContaining({
        id: 'template-1',
        createdByName: 'Test User',
        updatedByName: 'Test User',
      }),
    ]);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM templates t'));
  });

  it('applies type filter for email/whatsapp query', async () => {
    const bind = vi.fn(() => ({
      all: async () => ({ results: [] }),
    }));
    const prepare = vi.fn((_query: string) => ({
      bind,
      all: vi.fn(async () => ({ results: [] })),
      first: vi.fn(async () => null),
      run: vi.fn(async () => ({ success: true, meta: {}, results: [] })),
    }));
    const db = { prepare, batch: vi.fn(async () => []) };

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates?type=whatsapp'),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(200);
    expect(bind).toHaveBeenCalledWith('whatsapp');
  });
});

describe('POST /api/templates', () => {
  const randomUuidSpy = vi.spyOn(crypto, 'randomUUID');

  beforeEach(() => {
    randomUuidSpy.mockReset();
  });

  afterEach(() => {
    randomUuidSpy.mockReset();
  });

  it('returns forbidden for users without templates access', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', type: 'email', content: 'Hi' }),
      }),
      data: { user: externalUserWithoutTemplatesAccess() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid request body', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      }),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', content: 'Hi' }),
      }),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when type is invalid', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', type: 'sms', content: 'Hi' }),
      }),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when type is not a string', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', type: 123, content: 'Hi' }),
      }),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('creates template and first version', async () => {
    randomUuidSpy
      .mockReturnValueOnce('template-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('version-1' as ReturnType<typeof crypto.randomUUID>);

    const batch = vi.fn(async () => []);
    const prepare = vi.fn((_query: string) => ({
      bind: vi.fn(() => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ success: true, meta: {}, results: [] }),
      })),
      all: vi.fn(async () => ({ results: [] })),
      first: vi.fn(async () => null),
      run: vi.fn(async () => ({ success: true, meta: {}, results: [] })),
    }));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '  Welcome  ',
          type: 'email',
          subject: '  Hello {{client_name}}  ',
          content: 'Hi {{client_name}}',
        }),
      }),
      env: { DB: { prepare, batch } },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(data).toEqual(expect.objectContaining({
      id: 'template-1',
      title: 'Welcome',
      type: 'email',
      subject: 'Hello {{client_name}}',
      content: 'Hi {{client_name}}',
      createdBy: 'user-1',
      updatedBy: 'user-1',
    }));
  });

  it('treats non-string optional fields as null/empty when creating', async () => {
    randomUuidSpy
      .mockReturnValueOnce('template-3' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('version-3' as ReturnType<typeof crypto.randomUUID>);

    const batch = vi.fn(async () => []);
    const prepare = vi.fn((_query: string) => ({
      bind: vi.fn(() => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => ({ success: true, meta: {}, results: [] }),
      })),
      all: vi.fn(async () => ({ results: [] })),
      first: vi.fn(async () => null),
      run: vi.fn(async () => ({ success: true, meta: {}, results: [] })),
    }));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'No Subject',
          type: 'email',
          subject: 123,
          content: 456,
        }),
      }),
      env: { DB: { prepare, batch } },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.subject).toBeNull();
    expect(data.content).toBe('');
  });
});
