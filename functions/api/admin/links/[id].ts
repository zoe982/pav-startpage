import type { Env } from '../../../types.ts';

interface LinkRow {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  is_visible: number;
}

interface LinkBody {
  title: string;
  url: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

interface LinkJson {
  id: string;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
}

function toLink(row: LinkRow): LinkJson {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    iconUrl: row.icon_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
  };
}

export const onRequestGet: PagesFunction<Env, 'id'> = async (context) => {
  const { env, params } = context;
  const id = params.id;

  const row = await env.DB.prepare(
    'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links WHERE id = ?',
  )
    .bind(id)
    .first<LinkRow>();

  if (!row) {
    return Response.json({ error: 'Link not found' }, { status: 404 });
  }

  return Response.json(toLink(row));
};

export const onRequestPut: PagesFunction<Env, 'id'> = async (context) => {
  const { request, env, params } = context;
  const id = params.id;
  const body: LinkBody = await request.json();

  if (!body.title || !body.url) {
    return Response.json({ error: 'Title and URL are required' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM links WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Link not found' }, { status: 404 });
  }

  await env.DB.prepare(
    `UPDATE links
     SET title = ?, url = ?, description = ?, icon_url = ?, sort_order = ?, is_visible = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      body.title,
      body.url,
      body.description ?? null,
      body.iconUrl ?? null,
      body.sortOrder ?? 0,
      body.isVisible !== false ? 1 : 0,
      id,
    )
    .run();

  return Response.json({
    id,
    title: body.title,
    url: body.url,
    description: body.description ?? null,
    iconUrl: body.iconUrl ?? null,
    sortOrder: body.sortOrder ?? 0,
    isVisible: body.isVisible !== false,
  });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
  const { env, params } = context;
  const id = params.id;

  const existing = await env.DB.prepare('SELECT id FROM links WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Link not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();

  return new Response(null, { status: 204 });
};
