import type { Env, AuthenticatedData } from '../../../types.ts';
import { isInternalUser } from '../../../types.ts';

interface GuestGrantRow {
  id: string;
  email: string;
  app_key: string;
  granted_by: string;
  granted_by_name: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, data } = context;
  if (!data.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { results } = await env.DB.prepare(
    `SELECT g.id, g.email, g.app_key, g.granted_by, u.name AS granted_by_name, g.created_at
     FROM guest_grants g
     JOIN users u ON g.granted_by = u.id
     ORDER BY g.email ASC, g.app_key ASC`,
  ).all<GuestGrantRow>();

  const grants = results.map((row) => ({
    id: row.id,
    email: row.email,
    appKey: row.app_key,
    grantedBy: row.granted_by,
    grantedByName: row.granted_by_name,
    createdAt: row.created_at,
  }));

  return Response.json(grants);
};

interface AddGuestBody {
  email: string;
  appKeys: string[];
}

const VALID_APP_KEYS = new Set(['brand-voice', 'templates', 'wiki']);

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  if (!data.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: AddGuestBody = await request.json();

  if (!body.email?.trim() || !body.email.includes('@')) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  if (isInternalUser(email)) {
    return Response.json({ error: 'Cannot add grants for internal domain users' }, { status: 400 });
  }

  if (!Array.isArray(body.appKeys) || body.appKeys.length === 0) {
    return Response.json({ error: 'At least one app key is required' }, { status: 400 });
  }

  const invalidKeys = body.appKeys.filter((k) => !VALID_APP_KEYS.has(k));
  if (invalidKeys.length > 0) {
    return Response.json({ error: `Invalid app keys: ${invalidKeys.join(', ')}` }, { status: 400 });
  }

  const statements = body.appKeys.map((appKey) =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO guest_grants (id, email, app_key, granted_by)
       VALUES (?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), email, appKey, data.user.id),
  );

  await env.DB.batch(statements);

  return Response.json({ success: true }, { status: 201 });
};
