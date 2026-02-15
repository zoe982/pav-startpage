import type { Env } from '../../types.ts';

interface LinkRow {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  is_visible: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const { results } = await env.DB.prepare(
    'SELECT id, title, url, description, icon_url, sort_order, is_visible FROM links WHERE is_visible = 1 ORDER BY sort_order ASC, title ASC',
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
