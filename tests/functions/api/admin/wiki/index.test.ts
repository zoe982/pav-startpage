import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../../functions/api/admin/wiki/index.ts';
import { createMockContext, createMockD1 } from '../../../../cf-helpers.ts';

describe('GET /api/admin/wiki', () => {
  it('returns all wiki pages', async () => {
    const rows = [
      { id: '1', slug: 'page-a', title: 'Page A', is_published: 1, show_on_start: 0, sort_order: 0 },
    ];
    const db = createMockD1(new Map([[
      'SELECT id, slug, title, is_published, show_on_start, sort_order FROM wiki_pages ORDER BY sort_order ASC, title ASC',
      rows,
    ]]));

    const ctx = createMockContext({ env: { DB: db } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].isPublished).toBe(true);
    expect(data[0].showOnStart).toBe(false);
  });
});

describe('POST /api/admin/wiki', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-id' as ReturnType<typeof crypto.randomUUID>);
  });

  it('creates a wiki page', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New', slug: 'new', content: '# New' }),
      }),
      env: { DB: db },
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe('new-id');
    expect(body.title).toBe('New');
    expect(body.slug).toBe('new');
  });

  it('returns 400 when title is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'test', content: '# Test' }),
      }),
      data: { user: { id: 'user-1' } },
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when slug is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', content: '# Test' }),
      }),
      data: { user: { id: 'user-1' } },
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', slug: 'test' }),
      }),
      data: { user: { id: 'user-1' } },
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 409 for duplicate slug', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM wiki_pages WHERE slug = ?', { id: 'existing' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New', slug: 'existing', content: '# New' }),
      }),
      env: { DB: db },
      data: { user: { id: 'user-1' } },
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('Slug already exists');
  });

  it('handles optional boolean fields', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New',
          slug: 'new',
          content: '# New',
          isPublished: true,
          showOnStart: true,
          sortOrder: 5,
        }),
      }),
      env: { DB: db },
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    const body = await response.json();
    expect(body.isPublished).toBe(true);
    expect(body.showOnStart).toBe(true);
    expect(body.sortOrder).toBe(5);
  });
});
