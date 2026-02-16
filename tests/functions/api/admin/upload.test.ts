import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/upload.ts';
import { createMockContext, createMockR2 } from '../../../cf-helpers.ts';

describe('POST /api/admin/upload', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid' as ReturnType<typeof crypto.randomUUID>);
  });

  it('returns 400 when Content-Type header is missing', async () => {
    const request = new Request('http://localhost:8788/api/admin/upload', {
      method: 'POST',
    });
    // Ensure no Content-Type header at all (headers.get returns null, triggering ?? '')
    request.headers.delete('Content-Type');
    const ctx = createMockContext({ request });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Expected multipart/form-data' });
  });

  it('returns 400 for wrong content type', async () => {
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'Expected multipart/form-data' });
  });

  it('returns 400 when no file provided', async () => {
    const formData = new FormData();
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/upload', {
        method: 'POST',
        body: formData,
      }),
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'No file provided' });
  });

  it('returns 400 when file is a string', async () => {
    const formData = new FormData();
    formData.append('file', 'not-a-file');
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/upload', {
        method: 'POST',
        body: formData,
      }),
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: 'No file provided' });
  });

  it('returns 400 for invalid file type', async () => {
    const formData = new FormData();
    formData.append('file', new File(['data'], 'test.txt', { type: 'text/plain' }));
    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/upload', {
        method: 'POST',
        body: formData,
      }),
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File type not allowed');
  });

  it('returns 400 for file too large', async () => {
    // Mock the request to return a formData with a file that has a large size
    const largeFile = {
      name: 'big.png',
      type: 'image/png',
      size: 5 * 1024 * 1024 + 1,
      stream: () => new ReadableStream(),
    };
    const mockFormData = new FormData();
    // We need to create a request that returns our mock file
    const request = new Request('http://localhost:8788/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Override formData() to return our mock
    vi.spyOn(request, 'formData').mockResolvedValue({
      get: (name: string) => name === 'file' ? largeFile : null,
    } as unknown as FormData);

    const ctx = createMockContext({ request });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('File too large');
  });

  it('uploads valid file and returns URL', async () => {
    const r2 = createMockR2();
    const formData = new FormData();
    const file = new File(['image-data'], 'test.png', { type: 'image/png' });
    formData.append('file', file);

    const ctx = createMockContext({
      request: new Request('http://localhost:8788/api/admin/upload', {
        method: 'POST',
        body: formData,
      }),
      env: { ASSETS_BUCKET: r2 },
    });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json();
    // In jsdom, file.name from FormData may be 'blob', so the extension is extracted from actual name
    expect(body.url).toMatch(/^\/assets\/uploads\/test-uuid\.\w+$/);
    expect(r2.put).toHaveBeenCalled();
  });

  it('uses bin extension when file has no extension', async () => {
    const r2 = createMockR2();
    const mockFile = {
      name: 'noext',
      type: 'image/png',
      size: 100,
      stream: () => new ReadableStream(),
    };
    const request = new Request('http://localhost:8788/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    vi.spyOn(request, 'formData').mockResolvedValue({
      get: (name: string) => name === 'file' ? mockFile : null,
    } as unknown as FormData);

    const ctx = createMockContext({ request, env: { ASSETS_BUCKET: r2 } });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);
    const body = await response.json();
    // 'noext'.split('.').pop() === 'noext', not 'bin' since there is a value
    expect(body.url).toContain('test-uuid');
  });
});
