import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../functions/api/brand-voice/rewrite.ts';
import { createMockContext } from '../../../cf-helpers.ts';

interface ThreadRow {
  id: string;
  title: string;
  mode: 'rewrite' | 'draft';
  style: 'email' | 'whatsapp' | 'document' | 'instagram' | 'facebook' | 'other';
  custom_style_description: string | null;
  latest_draft: string;
  pinned_draft: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  draft_text: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface DbState {
  rulesMarkdown: string;
  servicesMarkdown: string;
  threads: ThreadRow[];
  messages: MessageRow[];
}

function createStatefulDb(initial: Partial<DbState> = {}): { db: D1Database } {
  const state: DbState = {
    rulesMarkdown: initial.rulesMarkdown ?? '# Rules',
    servicesMarkdown: initial.servicesMarkdown ?? '# Services',
    threads: initial.threads ?? [],
    messages: initial.messages ?? [],
  };

  const db = {
    prepare: vi.fn((query: string) => {
      let boundValues: unknown[] = [];
      const stmt = {
        bind: vi.fn((...values: unknown[]) => {
          boundValues = values;
          return stmt;
        }),
        first: vi.fn(async () => {
          if (query.includes('SELECT rules_markdown, services_markdown FROM brand_settings')) {
            return {
              rules_markdown: state.rulesMarkdown,
              services_markdown: state.servicesMarkdown,
            };
          }

          if (query.includes('SELECT id FROM brand_voice_threads WHERE id = ?')) {
            const id = String(boundValues[0] ?? '');
            return state.threads.find((thread) => thread.id === id) ? { id } : null;
          }

          if (query.includes('FROM brand_voice_threads') && query.includes('WHERE id = ?')) {
            const id = String(boundValues[0] ?? '');
            return state.threads.find((thread) => thread.id === id) ?? null;
          }

          return null;
        }),
        all: vi.fn(async () => {
          if (
            query.includes('SELECT id, title')
            && query.includes('FROM brand_voice_threads')
            && !query.includes('WHERE id = ?')
          ) {
            return {
              results: [...state.threads].sort((a, b) =>
                a.last_message_at < b.last_message_at ? 1 : -1,
              ),
            };
          }

          if (query.includes('FROM brand_voice_messages') && query.includes('WHERE thread_id = ?')) {
            const threadId = String(boundValues[0] ?? '');
            return {
              results: state.messages
                .filter((message) => message.thread_id === threadId)
                .sort((a, b) => (a.created_at < b.created_at ? -1 : 1)),
            };
          }

          return { results: [] };
        }),
        run: vi.fn(async () => {
          if (query.includes('INSERT INTO brand_voice_threads')) {
            const [
              id,
              title,
              mode,
              style,
              customStyleDescription,
              latestDraft,
              pinnedDraft,
              createdBy,
              createdByName,
            ] = boundValues as [
              string,
              string,
              ThreadRow['mode'],
              ThreadRow['style'],
              string | null,
              string,
              string | null,
              string,
              string,
            ];

            state.threads.push({
              id,
              title,
              mode,
              style,
              custom_style_description: customStyleDescription,
              latest_draft: latestDraft,
              pinned_draft: pinnedDraft,
              created_by: createdBy,
              created_by_name: createdByName,
              created_at: '2026-02-17T12:00:00.000Z',
              updated_at: '2026-02-17T12:00:00.000Z',
              last_message_at: '2026-02-17T12:00:00.000Z',
            });
          }

          if (query.includes('INSERT INTO brand_voice_messages')) {
            const [
              id,
              threadId,
              role,
              content,
              draftText,
              createdBy,
              createdByName,
            ] = boundValues as [
              string,
              string,
              MessageRow['role'],
              string,
              string | null,
              string | null,
              string | null,
            ];

            state.messages.push({
              id,
              thread_id: threadId,
              role,
              content,
              draft_text: draftText,
              created_by: createdBy,
              created_by_name: createdByName,
              created_at: role === 'assistant'
                ? '2026-02-17T12:00:02.000Z'
                : '2026-02-17T12:00:01.000Z',
            });
          }

          if (query.includes('UPDATE brand_voice_threads SET title = ?')) {
            const [title, id] = boundValues as [string, string];
            const thread = state.threads.find((item) => item.id === id);
            if (thread) {
              thread.title = title;
              thread.updated_at = '2026-02-17T12:30:00.000Z';
            }
          }

          if (query.includes('SET pinned_draft = latest_draft')) {
            const [id] = boundValues as [string];
            const thread = state.threads.find((item) => item.id === id);
            if (thread) {
              thread.pinned_draft = thread.latest_draft;
              thread.updated_at = '2026-02-17T12:40:00.000Z';
            }
          }

          if (query.includes('UPDATE brand_voice_threads') && query.includes('SET mode = ?')) {
            const [
              mode,
              style,
              customStyleDescription,
              latestDraft,
              id,
            ] = boundValues as [ThreadRow['mode'], ThreadRow['style'], string | null, string, string];
            const thread = state.threads.find((item) => item.id === id);
            if (thread) {
              thread.mode = mode;
              thread.style = style;
              thread.custom_style_description = customStyleDescription;
              thread.latest_draft = latestDraft;
              thread.updated_at = '2026-02-17T12:20:00.000Z';
              thread.last_message_at = '2026-02-17T12:20:00.000Z';
            }
          }

          return {
            success: true,
            meta: {},
            results: [],
          };
        }),
      };

      return stmt;
    }),
  } as unknown as D1Database;

  return { db };
}

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

function noAccessUser() {
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

describe('Brand Voice chat API', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('thread-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('msg-user-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('msg-assistant-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('msg-user-2' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('msg-assistant-2' as ReturnType<typeof crypto.randomUUID>);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('GET lists shared threads', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Welcome email (Test User)',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Draft body',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite'),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { threads: Array<{ id: string; title: string }> };
    expect(body.threads).toEqual([{ id: 'thread-1', title: 'Welcome email (Test User)' }]);
  });

  it('GET returns a thread payload when threadId query is provided', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Welcome email (Test User)',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Draft body',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
      messages: [
        {
          id: 'msg-user-1',
          thread_id: 'thread-1',
          role: 'user',
          content: 'Need a message',
          draft_text: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:01.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite?threadId=thread-1'),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { id: string; messages: Array<{ id: string }> } };
    expect(body.thread.id).toBe('thread-1');
    expect(body.thread.messages).toEqual([{ id: 'msg-user-1', role: 'user', content: 'Need a message' }]);
  });

  it('returns 403 for users without brand-voice access', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite'),
      env: { DB: db },
      data: { user: noAccessUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(403);
  });

  it('POST start creates a thread and returns 201', async () => {
    const { db } = createStatefulDb({
      rulesMarkdown: '# Rules',
      servicesMarkdown: '# Services',
    });

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                assistantMessage: 'Drafted your content.',
                draft: 'Hello from Pet Air Valet',
                threadTitle: 'Welcome email',
              }),
            },
          },
        ],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          text: 'Write a welcome email',
          style: 'email',
          mode: 'draft',
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-token',
      },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json() as { thread: { id: string; title: string; messages: unknown[] } };
    expect(body.thread.id).toBe('thread-1');
    expect(body.thread.title).toContain('(Test User)');
    expect(body.thread.messages).toHaveLength(2);
  });

  it('POST reply uses conversation history and returns thread', async () => {
    const { db } = createStatefulDb({
      rulesMarkdown: '# Rules',
      servicesMarkdown: '# Services',
      threads: [
        {
          id: 'thread-1',
          title: 'Welcome email (Test User)',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'First draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
      messages: [
        {
          id: 'msg-user-1',
          thread_id: 'thread-1',
          role: 'user',
          content: 'Draft this',
          draft_text: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:01.000Z',
        },
        {
          id: 'msg-assistant-1',
          thread_id: 'thread-1',
          role: 'assistant',
          content: 'Here is the first draft',
          draft_text: 'First draft',
          created_by: null,
          created_by_name: 'Brand Voice Colleague',
          created_at: '2026-02-17T12:00:02.000Z',
        },
      ],
    });

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                assistantMessage: 'Updated with your request.',
                draft: 'Second draft',
              }),
            },
          },
        ],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          threadId: 'thread-1',
          message: 'Make it shorter',
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-token',
      },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { latestDraft: string; messages: unknown[] } };
    expect(body.thread.latestDraft).toBe('Second draft');
    expect(body.thread.messages).toHaveLength(4);
  });

  it('POST rename updates thread title', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Old title',
          mode: 'rewrite',
          style: 'other',
          custom_style_description: null,
          latest_draft: 'Draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          threadId: 'thread-1',
          title: '  New title  ',
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { title: string } };
    expect(body.thread.title).toBe('New title');
  });

  it('POST pin sets pinned draft to latest draft', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'rewrite',
          style: 'other',
          custom_style_description: null,
          latest_draft: 'Pinned me',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', threadId: 'thread-1' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { pinnedDraft: string | null } };
    expect(body.thread.pinnedDraft).toBe('Pinned me');
  });

  it('POST returns 400 for unsupported action', async () => {
    const { db } = createStatefulDb();

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsupported' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Unsupported action' });
  });

  it('POST start returns 422 when brand rules are missing', async () => {
    const { db } = createStatefulDb({ rulesMarkdown: '' });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          text: 'Write me something',
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(422);
  });

  it('POST reply returns 502 when AI gateway fails', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'rewrite',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          threadId: 'thread-1',
          message: 'Refine this draft',
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-token',
      },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(502);
  });
});
