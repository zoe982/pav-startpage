import type { Env } from '../../types.ts';

function generateRandomHex(bytesLength = 16): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestGet: PagesFunction<Env> = (context) => {
  const { env, request } = context;
  const url = new URL(request.url);

  const state = generateRandomHex(16);
  const nonce = generateRandomHex(16);

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
    nonce,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const isSecure = url.protocol === 'https:';
  const cookieFlags = `HttpOnly; Path=/; SameSite=Lax; Max-Age=${10 * 60}${isSecure ? '; Secure' : ''}`;

  const headers = new Headers({ Location: authUrl });
  headers.append('Set-Cookie', `__oauth_state=${state}; ${cookieFlags}`);
  headers.append('Set-Cookie', `__oauth_nonce=${nonce}; ${cookieFlags}`);

  return new Response(null, { status: 302, headers });
};
