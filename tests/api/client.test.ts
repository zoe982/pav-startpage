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

  it('throws ApiError with fallback when JSON parse fails on error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not json', { status: 500 }),
    );

    try {
      await apiFetch('/api/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Unknown error');
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
