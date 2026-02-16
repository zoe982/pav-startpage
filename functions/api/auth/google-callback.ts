import type { Env } from '../../types.ts';

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  hd?: string;
}

function decodeJwtPayload(token: string): GoogleIdTokenPayload {
  const parts = token.split('.');
  const payload = parts[1];
  if (!payload) throw new Error('Invalid token');

  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded) as GoogleIdTokenPayload;
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

  if (!code) {
    return Response.redirect(`${url.origin}/login?error=no_code`, 302);
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
      return Response.redirect(`${url.origin}/login?error=token_exchange`, 302);
    }

    tokens = await tokenResponse.json();
  } catch {
    return Response.redirect(`${url.origin}/login?error=token_exchange`, 302);
  }

  // Decode the ID token (we trust Google's response here)
  let payload: GoogleIdTokenPayload;
  try {
    payload = decodeJwtPayload(tokens.id_token);
  } catch {
    return Response.redirect(`${url.origin}/login?error=invalid_token`, 302);
  }

  // Verify email: must be @petairvalet.com domain OR in the ALLOWED_EMAILS list
  const allowedEmails = env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const emailLower = payload.email.toLowerCase();
  const allowedDomains = ['petairvalet.com', 'marsico.org'];
  const isDomainAllowed = allowedDomains.some((d) => emailLower.endsWith(`@${d}`));
  const isExplicitlyAllowed = allowedEmails.includes(emailLower);

  if (!isDomainAllowed && !isExplicitlyAllowed) {
    return Response.redirect(`${url.origin}/login?error=unauthorized_domain`, 302);
  }

  if (!payload.email_verified) {
    return Response.redirect(`${url.origin}/login?error=unverified_email`, 302);
  }

  // Check if user is admin
  const adminEmails = env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(payload.email.toLowerCase()) ? 1 : 0;

  // Upsert user
  const userId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture_url, is_admin, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       picture_url = excluded.picture_url,
       is_admin = excluded.is_admin,
       updated_at = datetime('now')`,
  )
    .bind(userId, payload.email, payload.name, payload.picture ?? null, isAdmin)
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
  const isSecure = url.protocol === 'https:';
  const cookieFlags = `HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isSecure ? '; Secure' : ''}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `__session=${sessionId}; ${cookieFlags}`,
    },
  });
};
