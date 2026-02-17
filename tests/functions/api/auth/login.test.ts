import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/auth/login.ts';
import { createMockContext } from '../../../cf-helpers.ts';

describe('GET /api/auth/login', () => {
  it('redirects to Google OAuth URL', async () => {
    const ctx = createMockContext({
      env: {
        GOOGLE_CLIENT_ID: 'my-client-id',
        GOOGLE_REDIRECT_URI: 'http://localhost:8788/api/auth/google-callback',
      },
    });
    const response = await onRequestGet(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get('Location')!;
    expect(location).toContain('accounts.google.com');
    expect(location).toContain('client_id=my-client-id');
    expect(location).toContain('redirect_uri=');
    expect(location).toContain('response_type=code');
    expect(location).toContain('scope=openid+email+profile');
  });

  it('adds Secure cookie flag for https requests', async () => {
    const ctx = createMockContext({
      request: new Request('https://example.com/api/auth/login'),
      env: {
        GOOGLE_CLIENT_ID: 'my-client-id',
        GOOGLE_REDIRECT_URI: 'https://example.com/api/auth/google-callback',
      },
    });

    const response = await onRequestGet(ctx);

    expect(response.status).toBe(302);
    const cookie = response.headers.get('Set-Cookie') ?? '';
    expect(cookie).toContain('Secure');
  });
});
