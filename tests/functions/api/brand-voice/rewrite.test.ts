import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../../functions/api/brand-voice/rewrite.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

describe('POST /api/brand-voice/rewrite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 400 when text is missing', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when text exceeds 10000 characters', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'a'.repeat(10001) }),
      }),
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when customStyleDescription exceeds 500 characters', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello', style: 'other', customStyleDescription: 'a'.repeat(501) }),
      }),
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const data = await response.json() as { error: string };
    expect(data.error).toContain('Custom style description');
  });

  it('returns 400 when feedback exceeds 2000 characters', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Rules', services_markdown: '' },
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          currentRewritten: 'Hi there',
          feedback: 'a'.repeat(2001),
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const data = await response.json() as { error: string };
    expect(data.error).toContain('Feedback');
  });

  it('returns 422 when no brand rules are configured', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '', services_markdown: '' },
    ]]));

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello world' }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(422);
  });

  it('calls OpenAI and returns rewritten text', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Be friendly', services_markdown: '' },
    ]]));

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: 'Hello, friend!' } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hey there' }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    const data = await response.json();
    expect(data.original).toBe('Hey there');
    expect(data.rewritten).toBe('Hello, friend!');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://gateway.example.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('returns 502 when OpenAI returns an error', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Rules', services_markdown: '' },
    ]]));

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test text' }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(502);
  });

  it('uses custom style description when style is other', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Rules', services_markdown: '' },
    ]]));

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: 'Caption here' } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          style: 'other',
          customStyleDescription: 'Instagram caption',
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);

    // Verify the system prompt includes the custom description
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]!.body as string);
    const systemMessage = requestBody.messages[0].content;
    expect(systemMessage).toContain('Instagram caption');
    expect(systemMessage).toContain('Format the output according to these instructions');
  });

  it('sends 4-message conversation for refinement requests', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Rules', services_markdown: '' },
    ]]));

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: 'Refined output' } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Original text',
          style: 'email',
          mode: 'rewrite',
          currentRewritten: 'Previous rewrite',
          feedback: 'Make it shorter',
        }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    const response = await onRequestPost(ctx);
    const data = await response.json();
    expect(data.original).toBe('Original text');
    expect(data.rewritten).toBe('Refined output');

    // Verify 4-message conversation structure
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]!.body as string);
    expect(requestBody.messages).toHaveLength(4);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1]).toEqual({ role: 'user', content: 'Original text' });
    expect(requestBody.messages[2]).toEqual({ role: 'assistant', content: 'Previous rewrite' });
    expect(requestBody.messages[3]).toEqual({ role: 'user', content: 'Please refine based on: Make it shorter' });
  });

  it('sends 2-message conversation for non-refinement requests', async () => {
    const db = createMockD1(new Map([[
      'SELECT rules_markdown, services_markdown FROM brand_settings WHERE id = 1',
      { rules_markdown: '# Rules', services_markdown: '' },
    ]]));

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: 'Rewritten' } }],
      }), { status: 200 }),
    );

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/brand-voice/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello', style: 'email', mode: 'rewrite' }),
      }),
      env: {
        DB: db,
        AI_GATEWAY_ENDPOINT: 'https://gateway.example.com',
        CF_AI_GATEWAY_TOKEN: 'test-key',
      },
      data: { user: { id: 'user-1', isInternal: true, appGrants: [] } },
    });

    await onRequestPost(ctx);

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]!.body as string);
    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1]).toEqual({ role: 'user', content: 'Hello' });
  });
});
