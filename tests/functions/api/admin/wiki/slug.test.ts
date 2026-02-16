import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPut, onRequestDelete } from '../../../../../functions/api/admin/wiki/[slug].ts';
import { createMockContext, createMockD1 } from '../../../../cf-helpers.ts';

describe('GET /api/admin/wiki/:slug', () => {
  it('returns page when found', async () => {
    const row = {
      id: '1', slug: 'test', title: 'Test', content: '# Content',
      is_published: 1, show_on_start: 0, sort_order: 0,
    };
    const db = createMockD1(new Map([[
      'SELECT id, slug, title, content, is_published, show_on_start, sort_order FROM wiki_pages WHERE slug = ?',
      row,
    ]]));

    const ctx = createMockContext({ env: { DB: db }, params: { slug: 'test' } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data.slug).toBe('test');
    expect(data.isPublished).toBe(true);
  });

  it('returns 404 when not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, params: { slug: 'nonexistent' } });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/admin/wiki/:slug', () => {
  it('updates page when found', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM wiki_pages WHERE slug = ?', { id: 'page-1' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', slug: 'test', content: '# Updated' }),
      }),
      env: { DB: db },
      params: { slug: 'test' },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.title).toBe('Updated');
    expect(data.id).toBe('page-1');
  });

  it('returns 400 for missing fields', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      }),
      params: { slug: 'test' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 404 when page not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', slug: 's', content: 'c' }),
      }),
      env: { DB: db },
      params: { slug: 'nonexistent' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(404);
  });

  it('returns 409 for slug conflict on change', async () => {
    // We need prepare to return different values for different queries
    // When checking existing page: return page-1
    // When checking slug conflict: return conflicting page
    const db = {
      prepare: vi.fn((query: string) => {
        const stmt = {
          bind: vi.fn(() => stmt),
          first: vi.fn(async () => {
            if (query.includes('slug = ? AND id !=')) {
              return { id: 'other-page' }; // conflict
            }
            return { id: 'page-1' }; // existing page
          }),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ results: [], success: true, meta: {} })),
        };
        return stmt;
      }),
    };

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', slug: 'conflicting-slug', content: '# Content' }),
      }),
      env: { DB: db },
      params: { slug: 'test' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('Slug already exists');
  });

  it('allows slug change when no conflict exists', async () => {
    // Slug changes: body.slug !== params.slug, but no conflicting page exists
    const db = {
      prepare: vi.fn((query: string) => {
        const stmt = {
          bind: vi.fn(() => stmt),
          first: vi.fn(async () => {
            if (query.includes('slug = ? AND id !=')) {
              return null; // no conflict
            }
            return { id: 'page-1' }; // existing page
          }),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ results: [], success: true, meta: {} })),
        };
        return stmt;
      }),
    };

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/old-slug', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', slug: 'new-slug', content: '# Updated' }),
      }),
      env: { DB: db },
      params: { slug: 'old-slug' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.slug).toBe('new-slug');
    expect(data.title).toBe('Updated');
  });

  it('allows same slug (no conflict check)', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM wiki_pages WHERE slug = ?', { id: 'page-1' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', slug: 'test', content: '# Updated' }),
      }),
      env: { DB: db },
      params: { slug: 'test' },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.title).toBe('Updated');
  });

  it('handles optional fields with defaults', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM wiki_pages WHERE slug = ?', { id: 'page-1' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test', slug: 'test', content: '# Hi',
          isPublished: true, showOnStart: true, sortOrder: 10,
        }),
      }),
      env: { DB: db },
      params: { slug: 'test' },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.isPublished).toBe(true);
    expect(data.showOnStart).toBe(true);
    expect(data.sortOrder).toBe(10);
  });
});

describe('DELETE /api/admin/wiki/:slug', () => {
  it('deletes page when found', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM wiki_pages WHERE slug = ?', { id: '1' }],
    ]));

    const ctx = createMockContext({
      env: { DB: db },
      params: { slug: 'test' },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      env: { DB: db },
      params: { slug: 'nonexistent' },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(404);
  });
});
