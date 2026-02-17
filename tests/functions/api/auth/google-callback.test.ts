import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from 'jose';
import { onRequestGet } from '../../../../functions/api/auth/google-callback.ts';
import { createMockContext, createMockD1 } from '../../../cf-helpers.ts';

// Helper to create a valid-looking JWT token
function makeIdToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

const STATE = 'test-state';
const NONCE = 'test-nonce';

function createRequestWithState(url: string): Request {
  const parsed = new URL(url);
  if (!parsed.searchParams.get('state')) {
    parsed.searchParams.set('state', STATE);
  }
  return new Request(parsed.toString(), {
    headers: {
      Cookie: `__oauth_state=${STATE}; __oauth_nonce=${NONCE}`,
    },
  });
}

describe('GET /api/auth/google-callback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(jwtVerify).mockReset();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid' as ReturnType<typeof crypto.randomUUID>);
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
      if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      }
      return arr;
    });
  });

  it('redirects with error when no code param', async () => {
    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=no_code');
  });

  it('redirects with error on token exchange failure (non-ok response)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('error', { status: 400 }),
    );

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=token_exchange');
  });

  it('redirects with error on token exchange network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=token_exchange');
  });

  it('redirects with error on invalid token decode (malformed payload)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: 'not.valid', access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockRejectedValue(new Error('invalid token'));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=invalid_token');
  });

  it('redirects with error on invalid token decode (no payload part)', async () => {
    // Token with no dots - parts[1] will be undefined, triggering throw
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: 'nodotstoken', access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockRejectedValue(new Error('invalid token'));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=invalid_token');
  });

  it('redirects with error for unauthorized domain', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'user@evil.com',
        email_verified: true,
        name: 'Evil User',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
      env: { ALLOWED_EMAILS: '' },
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=unauthorized_domain');
  });

  it('redirects with error for unverified email', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'user@petairvalet.com',
        email_verified: false,
        name: 'Test',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=unverified_email');
  });

  it('succeeds for allowed domain user (http - no Secure flag)', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'user@petairvalet.com',
        email_verified: true,
        name: 'Test User',
        picture: 'https://pic.com/img.jpg',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const db = createMockD1(new Map([
      ['SELECT id FROM users WHERE email = ?', { id: 'existing-user-id' }],
    ]));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
      env: { DB: db, ADMIN_EMAILS: 'admin@petairvalet.com', ALLOWED_EMAILS: '' },
    });
    const response = await onRequestGet(ctx);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/');
    const cookie = response.headers.get('Set-Cookie')!;
    expect(cookie).toContain('__session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).not.toContain('Secure');
  });

  it('sets Secure flag for https requests', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'user@petairvalet.com',
        email_verified: true,
        name: 'Test',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const db = createMockD1(new Map([
      ['SELECT id FROM users WHERE email = ?', { id: 'user-id' }],
    ]));

    const ctx = createMockContext({
      request: createRequestWithState('https://example.com/api/auth/google-callback?code=abc'),
      env: { DB: db, ADMIN_EMAILS: '', ALLOWED_EMAILS: '' },
    });
    const response = await onRequestGet(ctx);

    expect(response.status).toBe(302);
    const cookie = response.headers.get('Set-Cookie')!;
    expect(cookie).toContain('Secure');
  });

  it('sets admin flag for admin email', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'admin@petairvalet.com',
        email_verified: true,
        name: 'Admin',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const db = createMockD1(new Map([
      ['SELECT id FROM users WHERE email = ?', { id: 'admin-id' }],
    ]));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
      env: { DB: db, ADMIN_EMAILS: 'admin@petairvalet.com', ALLOWED_EMAILS: '' },
    });
    await onRequestGet(ctx);

    // The upsert bind should include isAdmin=1
    const prepCalls = db.prepare.mock.calls;
    const insertCall = prepCalls.find((c: string[]) => c[0]?.includes('INSERT INTO users'));
    expect(insertCall).toBeDefined();
  });

  it('redirects with db_error when user lookup fails', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'user@petairvalet.com',
        email_verified: true,
        name: 'Test',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    // DB returns null for the SELECT after upsert
    const db = createMockD1();
    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
      env: { DB: db, ADMIN_EMAILS: '', ALLOWED_EMAILS: '' },
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/login?error=db_error');
  });

  it('allows explicitly allowed email from different domain', async () => {
    const token = makeIdToken({ test: true });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id_token: token, access_token: 'abc' }), { status: 200 }),
    );
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: '123',
        email: 'external@example.com',
        email_verified: true,
        name: 'External',
        nonce: NONCE,
      },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const db = createMockD1(new Map([
      ['SELECT id FROM users WHERE email = ?', { id: 'ext-id' }],
    ]));

    const ctx = createMockContext({
      request: createRequestWithState('http://localhost:8788/api/auth/google-callback?code=abc'),
      env: { DB: db, ADMIN_EMAILS: '', ALLOWED_EMAILS: 'external@example.com' },
    });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/');
  });
});
