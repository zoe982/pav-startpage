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

interface DraftVersionRow {
  id: string;
  thread_id: string;
  version_number: number;
  draft_text: string;
  source: 'assistant' | 'manual' | 'restore';
  created_by: string | null;
  created_by_name: string;
  created_at: string;
}

interface DbState {
  rulesMarkdown: string;
  servicesMarkdown: string;
  threads: ThreadRow[];
  messages: MessageRow[];
  draftVersions: DraftVersionRow[];
}

function createStatefulDb(initial: Partial<DbState> = {}): { db: D1Database } {
  const state: DbState = {
    rulesMarkdown: initial.rulesMarkdown ?? '# Rules',
    servicesMarkdown: initial.servicesMarkdown ?? '# Services',
    threads: initial.threads ?? [],
    messages: initial.messages ?? [],
    draftVersions: initial.draftVersions ?? [],
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
            const firstBoundValue = boundValues[0];
            const id = typeof firstBoundValue === 'string' ? firstBoundValue : '';
            return state.threads.find((thread) => thread.id === id) ? { id } : null;
          }

          if (query.includes('FROM brand_voice_threads') && query.includes('WHERE id = ?')) {
            const firstBoundValue = boundValues[0];
            const id = typeof firstBoundValue === 'string' ? firstBoundValue : '';
            return state.threads.find((thread) => thread.id === id) ?? null;
          }

          if (query.includes('FROM brand_voice_draft_versions') && query.includes('MAX(version_number)')) {
            const firstBoundValue = boundValues[0];
            const threadId = typeof firstBoundValue === 'string' ? firstBoundValue : '';
            const versions = state.draftVersions.filter((version) => version.thread_id === threadId);
            const maxVersion = versions.length === 0
              ? null
              : Math.max(...versions.map((version) => version.version_number));
            return { max_version: maxVersion };
          }

          if (query.includes('FROM brand_voice_draft_versions') && query.includes('WHERE id = ?') && query.includes('thread_id = ?')) {
            const [versionIdBound, threadIdBound] = boundValues;
            const versionId = typeof versionIdBound === 'string' ? versionIdBound : '';
            const threadId = typeof threadIdBound === 'string' ? threadIdBound : '';
            return state.draftVersions.find((version) => version.id === versionId && version.thread_id === threadId) ?? null;
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
            const firstBoundValue = boundValues[0];
            const threadId = typeof firstBoundValue === 'string' ? firstBoundValue : '';
            return {
              results: state.messages
                .filter((message) => message.thread_id === threadId)
                .sort((a, b) => (a.created_at < b.created_at ? -1 : 1)),
            };
          }

          if (query.includes('FROM brand_voice_draft_versions') && query.includes('WHERE thread_id = ?')) {
            const firstBoundValue = boundValues[0];
            const threadId = typeof firstBoundValue === 'string' ? firstBoundValue : '';
            return {
              results: state.draftVersions
                .filter((version) => version.thread_id === threadId)
                .sort((a, b) => b.version_number - a.version_number),
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

          if (query.includes('INSERT INTO brand_voice_draft_versions')) {
            const [
              id,
              threadId,
              versionNumber,
              draftText,
              source,
              createdBy,
              createdByName,
            ] = boundValues as [
              string,
              string,
              number,
              string,
              DraftVersionRow['source'],
              string | null,
              string,
            ];

            state.draftVersions.push({
              id,
              thread_id: threadId,
              version_number: versionNumber,
              draft_text: draftText,
              source,
              created_by: createdBy,
              created_by_name: createdByName,
              created_at: '2026-02-17T12:50:00.000Z',
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

          if (query.includes('UPDATE brand_voice_threads') && query.includes('SET latest_draft = ?') && !query.includes('SET mode = ?')) {
            const [latestDraft, id] = boundValues as [string, string];
            const thread = state.threads.find((item) => item.id === id);
            if (thread) {
              thread.latest_draft = latestDraft;
              thread.updated_at = '2026-02-17T12:55:00.000Z';
              thread.last_message_at = '2026-02-17T12:55:00.000Z';
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

  function aiEnv(db: D1Database) {
    return {
      DB: db,
      AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
      CF_AI_GATEWAY_TOKEN: 'test-token',
    };
  }

  function requestBodyString(init: RequestInit | undefined): string {
    const body = init?.body;
    if (typeof body === 'string') return body;
    if (body === undefined) return '';
    const serialized = JSON.stringify(body);
    return typeof serialized === 'string' ? serialized : '';
  }

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    const seededIds = [
      'thread-1',
      'msg-user-1',
      'msg-assistant-1',
      'version-1',
      'msg-user-2',
      'msg-assistant-2',
      'version-2',
      'version-3',
      'version-4',
    ];
    let idIndex = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      const fallback = `uuid-${idIndex + 1}`;
      const value = seededIds[idIndex] ?? fallback;
      idIndex += 1;
      return value as ReturnType<typeof crypto.randomUUID>;
    });
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
    const body = await response.json() as { threads: { id: string; title: string }[] };
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
    const body = await response.json() as { thread: { id: string; messages: { id: string }[] } };
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
          text: 'Write a welcome email. Need a polished welcome message.',
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
    const body = await response.json() as {
      thread: {
        id: string;
        title: string;
        messages: unknown[];
      };
    };
    expect(body.thread.id).toBe('thread-1');
    expect(body.thread.title).toContain('(Test User)');
    expect(body.thread.messages).toHaveLength(2);
  });

  it('POST start includes structured first-turn sections when rough draft is provided', async () => {
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
          goal: 'Write a welcome email.',
          roughDraft: 'Hi there, welcome aboard.',
          noDraftProvided: false,
          style: 'email',
          mode: 'draft',
        }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(url).toBe('https://gateway.example.com/chat/completions');
    const requestBody = requestBodyString(init!);
    expect(requestBody).toContain('Goal:');
    expect(requestBody).toContain('Write a welcome email.');
    expect(requestBody).toContain('Rough draft:');
    expect(requestBody).toContain('Hi there, welcome aboard.');
    expect(requestBody).not.toContain('Rough draft:\n---\nNo draft available\n---');
  });

  it('POST start returns 400 when structured first-turn fields are missing', async () => {
    const { db } = createStatefulDb();

    const missingGoalCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          noDraftProvided: true,
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingDraftChoiceCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          goal: 'Write a welcome email',
          noDraftProvided: false,
          roughDraft: '   ',
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingGoalResponse = await onRequestPost(missingGoalCtx);
    const missingDraftChoiceResponse = await onRequestPost(missingDraftChoiceCtx);

    expect(missingGoalResponse.status).toBe(400);
    expect(missingDraftChoiceResponse.status).toBe(400);
  });

  it('POST start builds first-turn payload with no draft fallback when acknowledged', async () => {
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
          goal: 'Draft a welcome message',
          noDraftProvided: true,
          style: 'email',
          mode: 'draft',
        }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls.at(-1);
    expect(fetchCall).toBeDefined();
    if (!fetchCall) return;
    const body = requestBodyString(fetchCall[1] as RequestInit | undefined);
    expect(body).toContain('Rough draft:');
    expect(body).toContain('No draft available');
  });

  it('POST start builds first-turn payload with provided rough draft', async () => {
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
          goal: 'Draft a welcome message',
          roughDraft: 'Initial copy from operations',
          noDraftProvided: false,
          style: 'email',
          mode: 'draft',
        }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls.at(-1);
    expect(fetchCall).toBeDefined();
    if (!fetchCall) return;
    const body = requestBodyString(fetchCall[1] as RequestInit | undefined);
    expect(body).toContain('Initial copy from operations');
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

  it('POST saveDraft validates required fields and missing thread', async () => {
    const { db } = createStatefulDb();

    const missingThreadIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDraft', threadId: 42, draftText: 'Draft text' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const invalidDraftCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDraft', threadId: 'thread-1', draftText: '' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingThreadCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDraft', threadId: 'missing', draftText: 'Draft text' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingThreadIdResponse = await onRequestPost(missingThreadIdCtx);
    const invalidDraftResponse = await onRequestPost(invalidDraftCtx);
    const missingThreadResponse = await onRequestPost(missingThreadCtx);

    expect(missingThreadIdResponse.status).toBe(400);
    expect(invalidDraftResponse.status).toBe(400);
    expect(missingThreadResponse.status).toBe(404);
  });

  it('POST saveDraft updates latest draft and appends a manual version', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Old draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
      draftVersions: [
        {
          id: 'existing-version',
          thread_id: 'thread-1',
          version_number: 1,
          draft_text: 'Old draft',
          source: 'assistant',
          created_by: null,
          created_by_name: 'Brand Voice Colleague',
          created_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveDraft', threadId: 'thread-1', draftText: 'Manually edited draft' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { latestDraft: string; draftVersions: { source: string; draftText: string }[] } };
    expect(body.thread.latestDraft).toBe('Manually edited draft');
    expect(body.thread.draftVersions[0]).toMatchObject({
      source: 'manual',
      draftText: 'Manually edited draft',
    });
  });

  it('POST restoreVersion validates required fields and missing resources', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Current draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const missingThreadIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 12, versionId: 'version-1' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingVersionIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 'thread-1', versionId: '' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const invalidVersionIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 'thread-1', versionId: 99 }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingThreadCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 'missing', versionId: 'version-1' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingVersionCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 'thread-1', versionId: 'missing' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingThreadIdResponse = await onRequestPost(missingThreadIdCtx);
    const missingVersionIdResponse = await onRequestPost(missingVersionIdCtx);
    const invalidVersionIdResponse = await onRequestPost(invalidVersionIdCtx);
    const missingThreadResponse = await onRequestPost(missingThreadCtx);
    const missingVersionResponse = await onRequestPost(missingVersionCtx);

    expect(missingThreadIdResponse.status).toBe(400);
    expect(missingVersionIdResponse.status).toBe(400);
    expect(invalidVersionIdResponse.status).toBe(400);
    expect(missingThreadResponse.status).toBe(404);
    expect(missingVersionResponse.status).toBe(404);
  });

  it('POST restoreVersion restores an older draft and appends a restore version', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'draft',
          style: 'email',
          custom_style_description: null,
          latest_draft: 'Current draft',
          pinned_draft: null,
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:00:00.000Z',
          updated_at: '2026-02-17T12:00:00.000Z',
          last_message_at: '2026-02-17T12:00:00.000Z',
        },
      ],
      draftVersions: [
        {
          id: 'version-7',
          thread_id: 'thread-1',
          version_number: 7,
          draft_text: 'Current draft',
          source: 'manual',
          created_by: 'user-1',
          created_by_name: 'Test User',
          created_at: '2026-02-17T12:10:00.000Z',
        },
        {
          id: 'version-3',
          thread_id: 'thread-1',
          version_number: 3,
          draft_text: 'Recovered draft',
          source: 'assistant',
          created_by: null,
          created_by_name: 'Brand Voice Colleague',
          created_at: '2026-02-17T12:00:00.000Z',
        },
      ],
    });

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreVersion', threadId: 'thread-1', versionId: 'version-3' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { thread: { latestDraft: string; draftVersions: { source: string; draftText: string }[] } };
    expect(body.thread.latestDraft).toBe('Recovered draft');
    expect(body.thread.draftVersions[0]).toMatchObject({
      source: 'restore',
      draftText: 'Recovered draft',
    });
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

  it('GET thread payload returns 404 when thread is missing', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite?threadId=missing'),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(404);
  });

  it('POST returns 403 for users without brand-voice access', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Hello' }),
      }),
      env: { DB: db },
      data: { user: noAccessUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(403);
  });

  it('POST start validates required text and text length', async () => {
    const { db } = createStatefulDb();

    const missingText = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: '' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const tooLong = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'a'.repeat(10001) }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingResponse = await onRequestPost(missingText);
    const tooLongResponse = await onRequestPost(tooLong);
    expect(missingResponse.status).toBe(400);
    expect(tooLongResponse.status).toBe(400);
  });

  it('POST start validates custom style length', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          text: 'Valid text',
          customStyleDescription: 'x'.repeat(501),
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('POST start validates roughDraft length limit', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          goal: 'Write a welcome email',
          roughDraft: 'x'.repeat(10001),
          noDraftProvided: false,
        }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request' });
  });

  it('POST start returns 502 when AI gateway fails', async () => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response('upstream failure', { status: 500 }));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Write this' }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(502);
  });

  it('POST start supports plain text AI output and title fallback values', async () => {
    const { db } = createStatefulDb({ servicesMarkdown: '' });
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: 'Plain text draft from AI',
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
          text: 'Write copy',
          mode: 'invalid-mode',
          style: 'invalid-style',
          customStyleDescription: '   ',
        }),
      }),
      env: aiEnv(db),
      data: { user: { ...internalUser(), name: '   ' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json() as { thread: { title: string; latestDraft: string } };
    expect(body.thread.title).toBe('Brand Voice Thread (User)');
    expect(body.thread.latestDraft).toBe('Plain text draft from AI');
  });

  it('POST start parses fenced JSON output and defaults missing assistant/draft fields', async () => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: '```json\n{"threadTitle":"Ops Workstream"}\n```',
            },
          },
        ],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Draft copy' }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json() as { thread: { title: string; messages: { role: string; content: string }[] } };
    expect(body.thread.title).toContain('Ops Workstream');
    expect(body.thread.messages.find((m) => m.role === 'assistant')?.content)
      .toBe('I updated the draft based on your latest request.');
  });

  it('POST start falls back when fenced JSON is invalid', async () => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: '```json\\n{not valid json}\\n```',
            },
          },
        ],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Draft copy' }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
  });

  it('POST start falls back when fenced JSON parses to a non-object', async () => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: '```json\n123\n```',
            },
          },
        ],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Draft copy' }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
  });

  it.each([
    ['whatsapp', 'WhatsApp message'],
    ['document', 'formal document'],
    ['instagram', 'IMAGE TEXT'],
    ['facebook', 'Facebook post'],
    ['other', 'general-purpose text'],
  ] as const)('POST start applies %s style instructions', async (style, expectedPromptSnippet) => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ assistantMessage: 'ok', draft: 'draft', threadTitle: 'Title' }) } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          text: 'Draft this',
          style,
          customStyleDescription: style === 'other' ? null : undefined,
        }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls.at(-1);
    expect(fetchCall).toBeDefined();
    if (!fetchCall) return;
    const body = requestBodyString(fetchCall[1] as RequestInit | undefined);
    expect(body).toContain(expectedPromptSnippet);
  });

  it('POST start uses custom style instruction for style=other when provided', async () => {
    const { db } = createStatefulDb();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ assistantMessage: 'ok', draft: 'draft', threadTitle: 'Title' }) } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          text: 'Draft this',
          style: 'other',
          customStyleDescription: 'Bullet points only',
        }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls.at(-1);
    expect(fetchCall).toBeDefined();
    if (!fetchCall) return;
    const body = requestBodyString(fetchCall[1] as RequestInit | undefined);
    expect(body).toContain('Bullet points only');
  });

  it('POST reply validates threadId/message and handles missing thread/rules', async () => {
    const { db } = createStatefulDb({ rulesMarkdown: '' });

    const missingThreadIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', threadId: 123, message: 'Hi' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingMessageCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', threadId: 'thread-1', message: '' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingThreadCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', threadId: 'missing', message: 'Hi' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingThreadIdResponse = await onRequestPost(missingThreadIdCtx);
    const missingMessageResponse = await onRequestPost(missingMessageCtx);
    const missingThreadResponse = await onRequestPost(missingThreadCtx);

    expect(missingThreadIdResponse.status).toBe(400);
    expect(missingMessageResponse.status).toBe(400);
    expect(missingThreadResponse.status).toBe(404);
  });

  it('POST reply returns 422 when rules are missing for an existing thread', async () => {
    const { db } = createStatefulDb({
      rulesMarkdown: '',
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

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', threadId: 'thread-1', message: 'Hi' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(422);
  });

  it('POST reply handles assistant history without draftText and empty AI choice content', async () => {
    const { db } = createStatefulDb({
      threads: [
        {
          id: 'thread-1',
          title: 'Thread',
          mode: 'draft',
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
      messages: [
        {
          id: 'msg-assistant-1',
          thread_id: 'thread-1',
          role: 'assistant',
          content: 'Assistant prior message',
          draft_text: null,
          created_by: null,
          created_by_name: 'Brand Voice Colleague',
          created_at: '2026-02-17T12:00:01.000Z',
        },
      ],
    });

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', threadId: 'thread-1', message: 'Next pass' }),
      }),
      env: aiEnv(db),
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);
  });

  it('POST rename validates required fields and missing thread', async () => {
    const { db } = createStatefulDb();

    const missingThreadIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', threadId: 123, title: 'Valid' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingTitleCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', threadId: 'thread-1', title: '   ' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const nonStringTitleCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', threadId: 'thread-1', title: 42 }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingThreadCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', threadId: 'thread-1', title: 'New title' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingThreadIdResponse = await onRequestPost(missingThreadIdCtx);
    const missingTitleResponse = await onRequestPost(missingTitleCtx);
    const nonStringTitleResponse = await onRequestPost(nonStringTitleCtx);
    const missingThreadResponse = await onRequestPost(missingThreadCtx);

    expect(missingThreadIdResponse.status).toBe(400);
    expect(missingTitleResponse.status).toBe(400);
    expect(nonStringTitleResponse.status).toBe(400);
    expect(missingThreadResponse.status).toBe(404);
  });

  it('POST pin validates required threadId and missing thread', async () => {
    const { db } = createStatefulDb();

    const missingThreadIdCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', threadId: 123 }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });
    const missingThreadCtx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', threadId: 'missing' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const missingThreadIdResponse = await onRequestPost(missingThreadIdCtx);
    const missingThreadResponse = await onRequestPost(missingThreadCtx);

    expect(missingThreadIdResponse.status).toBe(400);
    expect(missingThreadResponse.status).toBe(404);
  });

  it('POST start handles non-string action values as unsupported', async () => {
    const { db } = createStatefulDb();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 123 }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('uses empty brand settings when settings row is absent', async () => {
    const db = {
      prepare: vi.fn((query: string) => {
        const stmt = {
          bind: vi.fn(() => stmt),
          first: vi.fn(async () => (query.includes('FROM brand_settings') ? null : null)),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ success: true, results: [], meta: {} })),
        };
        return stmt;
      }),
    } as unknown as D1Database;

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', text: 'Write this' }),
      }),
      env: { DB: db },
      data: { user: internalUser() },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(422);
  });

});
