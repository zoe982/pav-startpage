import { describe, it, expect, vi } from 'vitest';
import { onRequestGet } from '../../../../functions/api/templates/[id]/versions.ts';
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

function deniedUser() {
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

function createPrepareMock(
  resolver: (query: string) => {
    readonly first?: unknown;
    readonly all?: unknown[];
  },
) {
  return vi.fn((query: string) => ({
    bind: vi.fn(() => ({
      first: async () => (resolver(query).first ?? null),
      all: async () => ({ results: resolver(query).all ?? [] }),
      run: async () => ({ success: true, results: [], meta: {} }),
    })),
    first: vi.fn(async () => (resolver(query).first ?? null)),
    all: vi.fn(async () => ({ results: resolver(query).all ?? [] })),
    run: vi.fn(async () => ({ success: true, results: [], meta: {} })),
  }));
}

describe('GET /api/templates/:id/versions', () => {
  it('returns forbidden without access', async () => {
    const ctx = createMockContext({
      params: { id: 'template-1' },
      data: { user: deniedUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('returns 404 when template does not exist', async () => {
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: null };
      }
      return {};
    });
    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'missing' },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
  });

  it('returns mapped version history rows', async () => {
    const prepare = createPrepareMock((query: string) => {
      if (query === 'SELECT id FROM templates WHERE id = ?') {
        return { first: { id: 'template-1' } };
      }
      if (query.includes('FROM template_versions tv')) {
        return {
          all: [
            {
              id: 'version-2',
              version_number: 2,
              title: 'Updated',
              type: 'email',
              subject: 'Subject',
              content: 'Content',
              changed_by_name: 'Admin',
              created_at: '2026-01-02T00:00:00.000Z',
            },
          ],
        };
      }
      return {};
    });
    const ctx = createMockContext({
      env: { DB: { prepare, batch: vi.fn(async () => []) } },
      params: { id: 'template-1' },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        id: 'version-2',
        versionNumber: 2,
        title: 'Updated',
        type: 'email',
        subject: 'Subject',
        content: 'Content',
        changedByName: 'Admin',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });
});
