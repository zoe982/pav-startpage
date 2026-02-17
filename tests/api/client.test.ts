import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, apiFetch } from '../../src/api/client.ts';

describe('ApiError', () => {
  it('creates error with status and message', () => {
    const error = new ApiError(404, 'Not found');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.name).toBe('ApiError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns JSON data on success', async () => {
    const data = { id: '1', name: 'Test' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiFetch('/api/test');
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      credentials: 'same-origin',
    }));
  });

  it('sets Content-Type to application/json by default', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await apiFetch('/api/test');
    const call = vi.mocked(fetch).mock.calls[0]!;
    const headers = call[1]!.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('allows custom headers to override defaults', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    await apiFetch('/api/test', {
      headers: { 'X-Custom': 'value' },
    });
    const call = vi.mocked(fetch).mock.calls[0]!;
    const headers = call[1]!.headers as Headers;
    expect(headers.get('X-Custom')).toBe('value');
  });

  it('does not force JSON content type for FormData payloads', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const body = new FormData();
    body.append('file', new Blob(['content'], { type: 'text/plain' }), 'sample.txt');
    await apiFetch('/api/upload', { method: 'POST', body });

    const call = vi.mocked(fetch).mock.calls[0]!;
    const headers = call[1]!.headers as Headers;
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('throws ApiError on non-OK response with error body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(403);
      expect((e as ApiError).message).toBe('Forbidden');
    }
  });

  it('throws ApiError with fallback message when body has no error field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('HTTP 500');
    }
  });

  it('falls back when JSON error fields are empty strings', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: '   ', message: '   ', detail: '' }), { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('HTTP 500');
    }
  });

  it('uses detail field when error and message are missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Detailed backend error' }), { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Detailed backend error');
    }
  });

  it('throws ApiError with fallback when JSON parse fails on error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not json', { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('not json');
    }
  });

  it('throws ApiError with status fallback when error body is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503, statusText: 'Service Unavailable' }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Request failed (HTTP 503 Service Unavailable)');
    }
  });

  it('uses status fallback for HTML error responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!doctype html><html><body>Bad Gateway</body></html>', {
        status: 502,
        statusText: 'Bad Gateway',
      }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Request failed (HTTP 502 Bad Gateway)');
    }
  });

  it('truncates very long plain-text error responses', async () => {
    const longText = 'x'.repeat(260);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(longText, { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const message = (e as ApiError).message;
      expect(message.length).toBe(220);
      expect(message.endsWith('…')).toBe(true);
    }
  });

  it('falls back to HTTP status when error body readers fail', async () => {
    const failingResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      clone: () => ({
        json: async () => {
          throw new Error('invalid json');
        },
      }),
      text: async () => {
        throw new Error('invalid text');
      },
    } as unknown as Response;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(failingResponse);

    try {
      await apiFetch('/api/test');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Request failed (HTTP 500 Internal Server Error)');
    }
  });

  it('returns undefined for 204 responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const result = await apiFetch('/api/test');
    expect(result).toBeUndefined();
  });
});
