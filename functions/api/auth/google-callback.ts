import type { Env } from '../../types.ts';
import { isInternalUser } from '../../types.ts';
import { createRemoteJWKSet, jwtVerify } from 'jose';

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
}

interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  hd?: string;
  nonce?: string;
}

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const parts = cookie.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return null;
}

function redirectWithClearedAuthCookies(url: string, isSecure: boolean): Response {
  const clearFlags = `HttpOnly; Path=/; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`;
  const headers = new Headers({ Location: url });
  headers.append('Set-Cookie', `__oauth_state=; ${clearFlags}`);
  headers.append('Set-Cookie', `__oauth_nonce=; ${clearFlags}`);
  return new Response(null, { status: 302, headers });
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const isSecure = url.protocol === 'https:';

  const stateCookie = getCookie(request, '__oauth_state');
  const nonceCookie = getCookie(request, '__oauth_nonce');

  if (!stateParam || !stateCookie || !nonceCookie || stateParam !== stateCookie) {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=invalid_state`, isSecure);
  }

  if (!code) {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=no_code`, isSecure);
  }

  // Exchange code for tokens
  let tokens: GoogleTokenResponse;
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return redirectWithClearedAuthCookies(`${url.origin}/login?error=token_exchange`, isSecure);
    }

    tokens = await tokenResponse.json();
  } catch {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=token_exchange`, isSecure);
  }

  // Verify the ID token against Google's JWKS and validate claims
  let payload: GoogleIdTokenPayload;
  try {
    const verified = await jwtVerify(tokens.id_token, JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = verified.payload as GoogleIdTokenPayload;
  } catch {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=invalid_token`, isSecure);
  }

  if (!payload.sub || !payload.email || typeof payload.email_verified !== 'boolean') {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=invalid_token`, isSecure);
  }

  if (payload.nonce !== nonceCookie) {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=invalid_nonce`, isSecure);
  }

  // Verify email: must be internal domain, in ALLOWED_EMAILS, or have guest grants
  const allowedEmails = env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const emailLower = payload.email.toLowerCase();
  const isDomainAllowed = isInternalUser(emailLower);
  const isExplicitlyAllowed = allowedEmails.includes(emailLower);

  let hasGuestGrants = false;
  if (!isDomainAllowed && !isExplicitlyAllowed) {
    const grantRow = await env.DB.prepare(
      'SELECT 1 FROM guest_grants WHERE email = ? LIMIT 1',
    ).bind(emailLower).first();
    hasGuestGrants = grantRow !== null;
  }

  if (!isDomainAllowed && !isExplicitlyAllowed && !hasGuestGrants) {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=unauthorized_domain`, isSecure);
  }

  if (!payload.email_verified) {
    return redirectWithClearedAuthCookies(`${url.origin}/login?error=unverified_email`, isSecure);
  }

  // Check if user is admin (env var always grants; panel-granted admin persists)
  const adminEmails = env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());
  const isAdminFromEnv = adminEmails.includes(emailLower) ? 1 : 0;

  // Upsert user — MAX preserves panel-granted admin when env var doesn't grant it
  const userId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture_url, is_admin, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       picture_url = excluded.picture_url,
       is_admin = MAX(excluded.is_admin, users.is_admin),
       updated_at = datetime('now')`,
  )
    .bind(userId, payload.email, payload.name ?? payload.email, payload.picture ?? null, isAdminFromEnv)
    .run();

  // Get the actual user ID (may differ if user already existed)
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(payload.email)
    .first<{ id: string }>();

  if (!user) {
    return Response.redirect(`${url.origin}/login?error=db_error`, 302);
  }

  // Create session (7-day expiry)
  const sessionId = generateSessionId();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES (?, ?, datetime('now', '+7 days'))`,
  )
    .bind(sessionId, user.id)
    .run();

  // Set cookie and redirect to home
  const cookieFlags = `HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isSecure ? '; Secure' : ''}`;

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', `__session=${sessionId}; ${cookieFlags}`);
  headers.append('Set-Cookie', `__oauth_state=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`);
  headers.append('Set-Cookie', `__oauth_nonce=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`);

  return new Response(null, { status: 302, headers });
};
