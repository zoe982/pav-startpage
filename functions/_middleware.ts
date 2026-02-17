import type { Env, SessionUser, AppKey } from './types.ts';
import { isInternalUser } from './types.ts';

interface UserRow {
  id: string;
  email: string;
  name: string;
  picture_url: string | null;
  is_admin: number;
}

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/google-callback',
] as const;

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.startsWith(p));
}

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;

  const match = /__session=([^;]+)/.exec(cookie);
  return match?.[1] ?? null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Allow public auth paths
  if (isPublicPath(url.pathname)) {
    return context.next();
  }

  // All other /api/ routes need auth
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // CSRF: verify Origin header on mutating requests
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) {
      return Response.json({ error: 'CSRF origin mismatch' }, { status: 403 });
    }
  }

  const sessionId = getSessionId(request);
  if (!sessionId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up session + user
  const result = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.picture_url, u.is_admin
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<UserRow>();

  if (!result) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const internal = isInternalUser(result.email);
  let appGrants: AppKey[] = [];
  if (!internal) {
    const { results: grantRows } = await env.DB.prepare(
      'SELECT app_key FROM guest_grants WHERE email = ?',
    ).bind(result.email.toLowerCase()).all<{ app_key: string }>();
    appGrants = grantRows.map((r) => r.app_key) as AppKey[];
  }

  const user: SessionUser = {
    id: result.id,
    email: result.email,
    name: result.name,
    pictureUrl: result.picture_url,
    isAdmin: result.is_admin === 1,
    isInternal: internal,
    appGrants,
  };

  // Attach user to context.data
  (context.data as { user: SessionUser }).user = user;

  return context.next();
};
