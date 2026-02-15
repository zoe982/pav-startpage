import type { Env } from '../../types.ts';

interface WikiPageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: number;
  show_on_start: number;
  sort_order: number;
}

export const onRequestGet: PagesFunction<Env, 'slug'> = async (context) => {
  const { env, params } = context;
  const slug = params.slug;

  const row = await env.DB.prepare(
    'SELECT id, slug, title, content, is_published, show_on_start, sort_order FROM wiki_pages WHERE slug = ? AND is_published = 1',
  )
    .bind(slug)
    .first<WikiPageRow>();

  if (!row) {
    return Response.json({ error: 'Page not found' }, { status: 404 });
  }

  return Response.json({
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    isPublished: row.is_published === 1,
    showOnStart: row.show_on_start === 1,
    sortOrder: row.sort_order,
  });
};
