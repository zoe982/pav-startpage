import type { Env, AuthenticatedData } from '../../../types.ts';

interface UserRow {
  id: string;
  email: string;
  name: string;
  picture_url: string | null;
  is_admin: number;
}

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, data } = context;
  if (!data.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, email, name, picture_url, is_admin FROM users ORDER BY name ASC',
  ).all<UserRow>();

  const users = results.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    pictureUrl: row.picture_url,
    isAdmin: row.is_admin === 1,
  }));

  return Response.json(users);
};

interface UpdateAdminBody {
  userId: string;
  isAdmin: boolean;
}

export const onRequestPut: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  if (!data.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: UpdateAdminBody = await request.json();

  if (!body.userId || typeof body.isAdmin !== 'boolean') {
    return Response.json({ error: 'userId and isAdmin are required' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?')
    .bind(body.userId)
    .first();

  if (!existing) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  await env.DB.prepare(
    'UPDATE users SET is_admin = ?, updated_at = datetime(\'now\') WHERE id = ?',
  ).bind(body.isAdmin ? 1 : 0, body.userId).run();

  return Response.json({ success: true });
};
