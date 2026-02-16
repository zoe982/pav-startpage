import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../../functions/api/admin/links/index.ts';
import { createMockContext, createMockD1 } from '../../../../cf-helpers.ts';

describe('GET /api/admin/links', () => {
  it('returns all links', async () => {
    const rows = [
      { id: '1', title: 'Link A', url: 'https://a.com', description: null, icon_url: null, sort_order: 0, is_visible: 1 },
    ];
    const db = createMockD1(new Map([[
      'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links ORDER BY sort_order ASC, title ASC',
      rows,
    ]]));

    const ctx = createMockContext({ env: { DB: db } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].isVisible).toBe(true);
  });
});

describe('POST /api/admin/links', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-id' as ReturnType<typeof crypto.randomUUID>);
  });

  it('creates a link', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New', url: 'https://new.com' }),
      }),
      env: { DB: db },
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe('new-id');
    expect(body.title).toBe('New');
    expect(body.url).toBe('https://new.com');
    expect(body.isVisible).toBe(true);
  });

  it('returns 400 when title is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://new.com' }),
      }),
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when url is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New' }),
      }),
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('sets optional fields with defaults', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New',
          url: 'https://new.com',
          description: 'Desc',
          iconUrl: 'https://icon.com/i.png',
          sortOrder: 5,
          isVisible: false,
        }),
      }),
      env: { DB: db },
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    const body = await response.json();
    expect(body.description).toBe('Desc');
    expect(body.iconUrl).toBe('https://icon.com/i.png');
    expect(body.sortOrder).toBe(5);
    expect(body.isVisible).toBe(false);
  });
});
