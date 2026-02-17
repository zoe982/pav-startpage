import type { Env, AuthenticatedData } from '../../../types.ts';

export const onRequestDelete: PagesFunction<Env, 'id', AuthenticatedData> = async (context) => {
  const { env, params, data } = context;
  if (!data.user.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;

  const existing = await env.DB.prepare('SELECT id FROM guest_grants WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Grant not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM guest_grants WHERE id = ?').bind(id).run();

  return new Response(null, { status: 204 });
};
