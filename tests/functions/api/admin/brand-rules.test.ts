import { describe, it, expect } from 'vitest';
import { onRequestPut } from '../../../../functions/api/admin/brand-rules.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('PUT /api/admin/brand-rules', () => {
  it('saves brand rules and returns updated data', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Updated', services_markdown: '# Svc', updated_at: '2025-06-01 12:00:00' },
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/brand-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesMarkdown: '# Updated', servicesMarkdown: '# Svc' }),
      }),
      env: { DB: db },
      data: { user: { id: 'admin-1', isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    const data = await response.json();
    expect(data.rulesMarkdown).toBe('# Updated');
    expect(data.servicesMarkdown).toBe('# Svc');
    expect(data.updatedAt).toBe('2025-06-01 12:00:00');
  });

  it('returns 400 when neither field is a string', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/brand-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesMarkdown: 123 }),
      }),
      data: { user: { id: 'admin-1', isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(400);
  });

  it('allows updating only rulesMarkdown', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
      { rules_markdown: '# New', services_markdown: '# Old', updated_at: '2025-06-01 12:00:00' },
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/brand-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesMarkdown: '# New' }),
      }),
      env: { DB: db },
      data: { user: { id: 'admin-1', isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(200);
  });

  it('allows updating only servicesMarkdown', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Existing', services_markdown: '# Updated services', updated_at: '2025-06-01 12:00:00' },
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/brand-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicesMarkdown: '# Updated services' }),
      }),
      env: { DB: db },
      data: { user: { id: 'admin-1', isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    expect(response.status).toBe(200);
  });

  it('returns empty fallbacks when readback row is missing', async () => {
    const db = createMockD1();

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/brand-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rulesMarkdown: '# Updated' }),
      }),
      env: { DB: db },
      data: { user: { id: 'admin-1', isAdmin: true } },
    });

    const response = await onRequestPut(ctx);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      rulesMarkdown: '',
      servicesMarkdown: '',
      updatedAt: null,
    });
  });
});
