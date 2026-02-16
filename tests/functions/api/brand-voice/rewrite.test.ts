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
      data: { user: { id: 'user-1' } },
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
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
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
      data: { user: { id: 'user-1' } },
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
      data: { user: { id: 'user-1' } },
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
      data: { user: { id: 'user-1' } },
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(502);
  });
});
