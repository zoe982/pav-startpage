import type { Env, AuthenticatedData } from '../../../types.ts';

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const { results } = await env.DB.prepare(
    'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links ORDER BY sort_order ASC, title ASC',
  ).all<LinkRow>();

  const links = results.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    iconUrl: row.icon_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
  }));

  return Response.json(links);
};

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  const body: LinkBody = await request.json();

  if (!body.title || !body.url) {
    return Response.json({ error: 'Title and URL are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO links (id, title, url, description, icon_url, sort_order, is_visible, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.title,
      body.url,
      body.description ?? null,
      body.iconUrl ?? null,
      body.sortOrder ?? 0,
      body.isVisible !== false ? 1 : 0,
      data.user.id,
    )
    .run();

  return Response.json(
    {
      id,
      title: body.title,
      url: body.url,
      description: body.description ?? null,
      iconUrl: body.iconUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      isVisible: body.isVisible !== false,
    },
    { status: 201 },
  );
};
