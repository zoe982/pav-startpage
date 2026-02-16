import { describe, it, expect, vi } from 'vitest';
import { onRequestGet, onRequestPut, onRequestDelete } from '../../../../../functions/api/admin/links/[id].ts';
import { createMockContext, createMockD1 } from '../../../../cf-helpers.ts';

describe('GET /api/admin/links/:id', () => {
  it('returns link when found', async () => {
    const row = { id: '1', title: 'Link', url: 'https://link.com', description: null, icon_url: null, sort_order: 0, is_visible: 1 };
    const db = createMockD1(new Map([[
      'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links WHERE id = ?',
      row,
    ]]));

    const ctx = createMockContext({ env: { DB: db }, params: { id: '1' } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data.id).toBe('1');
    expect(data.isVisible).toBe(true);
  });

  it('returns 404 when not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, params: { id: 'nonexistent' } });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/admin/links/:id', () => {
  it('updates link when found', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM links WHERE id = ?', { id: '1' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated', url: 'https://updated.com' }),
      }),
      env: { DB: db },
      params: { id: '1' },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.title).toBe('Updated');
    expect(data.id).toBe('1');
  });

  it('returns 400 for missing title', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://test.com' }),
      }),
      params: { id: '1' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 for missing url', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' }),
      }),
      params: { id: '1' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 404 when link not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', url: 'https://test.com' }),
      }),
      env: { DB: db },
      params: { id: 'nonexistent' },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(404);
  });

  it('handles optional fields with defaults', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM links WHERE id = ?', { id: '1' }],
    ]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/links/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          url: 'https://test.com',
          description: 'Desc',
          iconUrl: 'https://i.com/i.png',
          sortOrder: 3,
          isVisible: false,
        }),
      }),
      env: { DB: db },
      params: { id: '1' },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.description).toBe('Desc');
    expect(data.sortOrder).toBe(3);
    expect(data.isVisible).toBe(false);
  });
});

describe('DELETE /api/admin/links/:id', () => {
  it('deletes link when found', async () => {
    const db = createMockD1(new Map([
      ['SELECT id FROM links WHERE id = ?', { id: '1' }],
    ]));

    const ctx = createMockContext({
      env: { DB: db },
      params: { id: '1' },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    const db = createMockD1();
    const ctx = createMockContext({
      env: { DB: db },
      params: { id: 'nonexistent' },
    });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(404);
  });
});
