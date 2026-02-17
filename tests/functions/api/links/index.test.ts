import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/links/index.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('GET /api/links', () => {
  it('returns empty links for non-internal users', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, data: { user: { email: 'guest@example.com' } } });

    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('returns visible links', async () => {
    const rows = [
      { id: '1', title: 'Link A', url: 'https://a.com', description: 'Desc', icon_url: 'https://icon.com/a.png', sort_order: 0, is_visible: 1 },
      { id: '2', title: 'Link B', url: 'https://b.com', description: null, icon_url: null, sort_order: 1, is_visible: 1 },
    ];
    const db = createMockD1(new Map([[
      'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links WHERE is_visible = 1 ORDER BY sort_order ASC, title ASC',
      rows,
    ]]));

    const ctx = createMockContext({ env: { DB: db }, data: { user: { email: 'test@petairvalet.com' } } });
    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: '1',
      title: 'Link A',
      url: 'https://a.com',
      description: 'Desc',
      iconUrl: 'https://icon.com/a.png',
      sortOrder: 0,
      isVisible: true,
    });
    expect(data[1].iconUrl).toBeNull();
    expect(data[1].isVisible).toBe(true);
  });

  it('returns empty array when no links', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, data: { user: { email: 'test@petairvalet.com' } } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data).toEqual([]);
  });
});
