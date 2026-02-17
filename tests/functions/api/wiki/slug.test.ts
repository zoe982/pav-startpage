import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/wiki/[slug].ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('GET /api/wiki/:slug', () => {
  it('returns page when found', async () => {
    const row = {
      id: '1', slug: 'test', title: 'Test', content: '# Hello',
      is_published: 1, show_on_start: 0, sort_order: 0,
    };
    const db = createMockD1(new Map([[
      'SELECT id, slug, title, content, is_published, show_on_start, sort_order FROM wiki_pages WHERE slug = ? AND is_published = 1',
      row,
    ]]));

    const ctx = createMockContext({ env: { DB: db }, params: { slug: 'test' }, data: { user: { isInternal: true, appGrants: [] } } });
    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(data).toEqual({
      id: '1',
      slug: 'test',
      title: 'Test',
      content: '# Hello',
      isPublished: true,
      showOnStart: false,
      sortOrder: 0,
    });
  });

  it('returns 404 when page not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, params: { slug: 'nonexistent' }, data: { user: { isInternal: true, appGrants: [] } } });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Page not found' });
  });
});
