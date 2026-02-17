import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/brand-rules.ts';

const internalUser = { isInternal: true, appGrants: [] as string[] };
import { createMockContext, createMockD1 } from '../../cf-helpers.ts';

describe('GET /api/brand-rules', () => {
  it('returns brand rules and services', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Brand Guide', services_markdown: '# Services', updated_at: '2025-01-01 00:00:00' },
    ]]));

    const ctx = createMockContext({ env: { DB: db }, data: { user: internalUser } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data.rulesMarkdown).toBe('# Brand Guide');
    expect(data.servicesMarkdown).toBe('# Services');
    expect(data.updatedAt).toBe('2025-01-01 00:00:00');
  });

  it('returns empty strings when no row exists', async () => {
    const db = createMockD1();
    const ctx = createMockContext({ env: { DB: db }, data: { user: internalUser } });
    const response = await onRequestGet(ctx);
    const data = await response.json();
    expect(data.rulesMarkdown).toBe('');
    expect(data.servicesMarkdown).toBe('');
    expect(data.updatedAt).toBeNull();
  });
});
