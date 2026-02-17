import type { Env, AuthenticatedData } from '../../types.ts';
import { assertAppAccess } from '../../types.ts';

interface WikiRow {
  id: string;
  slug: string;
  title: string;
  is_published: number;
  show_on_start: number;
  sort_order: number;
}

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, data } = context;
  const denied = assertAppAccess(data.user, 'wiki');
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    'SELECT id, slug, title, is_published, show_on_start, sort_order FROM wiki_pages WHERE is_published = 1 ORDER BY sort_order ASC, title ASC',
  ).all<WikiRow>();

  const pages = results.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    isPublished: row.is_published === 1,
    showOnStart: row.show_on_start === 1,
    sortOrder: row.sort_order,
  }));

  return Response.json(pages);
};
