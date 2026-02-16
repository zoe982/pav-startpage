import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/wiki/index.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('GET /api/wiki', () => {
  it('returns published wiki pages', async () => {
    const rows = [
      { id: '1', slug: 'page-a', title: 'Page A', is_published: 1, show_on_start: 1, sort_order: 0 },
    ];
    const db = createMockD1(new Map([[
      'SELECT id, slug, title, is_published, show_on_start, sort_order FROM wiki_pages WHERE is_published = 1 ORDER BY sort_order ASC, title ASC',
      rows,
    ]]));

    const ctx = createMockContext({ env: { DB: db } });
    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(data).toEqual([{
      id: '1',
      slug: 'page-a',
      title: 'Page A',
      isPublished: true,
      showOnStart: true,
      sortOrder: 0,
    }]);
  });
});
