import type { Env } from '../../../types.ts';

interface WikiPageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: number;
  show_on_start: number;
  sort_order: number;
}

interface WikiBody {
  title: string;
  slug: string;
  content: string;
  isPublished?: boolean;
  showOnStart?: boolean;
  sortOrder?: number;
}

interface PageJson {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  showOnStart: boolean;
  sortOrder: number;
}

function toPage(row: WikiPageRow): PageJson {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    isPublished: row.is_published === 1,
    showOnStart: row.show_on_start === 1,
    sortOrder: row.sort_order,
  };
}

export const onRequestGet: PagesFunction<Env, 'slug'> = async (context) => {
  const { env, params } = context;
  const slug = params.slug;

  const row = await env.DB.prepare(
    'SELECT id, slug, title, content, is_published, show_on_start, sort_order FROM wiki_pages WHERE slug = ?',
  )
    .bind(slug)
    .first<WikiPageRow>();

  if (!row) {
    return Response.json({ error: 'Page not found' }, { status: 404 });
  }

  return Response.json(toPage(row));
};

export const onRequestPut: PagesFunction<Env, 'slug'> = async (context) => {
  const { request, env, params } = context;
  const slug = params.slug;
  const body: WikiBody = await request.json();

  if (!body.title || !body.slug || !body.content) {
    return Response.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 },
    );
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM wiki_pages WHERE slug = ?',
  )
    .bind(slug)
    .first<{ id: string }>();

  if (!existing) {
    return Response.json({ error: 'Page not found' }, { status: 404 });
  }

  // If slug is being changed, check uniqueness
  if (body.slug !== slug) {
    const conflict = await env.DB.prepare(
      'SELECT id FROM wiki_pages WHERE slug = ? AND id != ?',
    )
      .bind(body.slug, existing.id)
      .first();

    if (conflict) {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
  }

  await env.DB.prepare(
    `UPDATE wiki_pages
     SET slug = ?, title = ?, content = ?, is_published = ?, show_on_start = ?, sort_order = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      body.slug,
      body.title,
      body.content,
      body.isPublished ? 1 : 0,
      body.showOnStart ? 1 : 0,
      body.sortOrder ?? 0,
      existing.id,
    )
    .run();

  return Response.json({
    id: existing.id,
    slug: body.slug,
    title: body.title,
    content: body.content,
    isPublished: body.isPublished ?? false,
    showOnStart: body.showOnStart ?? false,
    sortOrder: body.sortOrder ?? 0,
  });
};

export const onRequestDelete: PagesFunction<Env, 'slug'> = async (context) => {
  const { env, params } = context;
  const slug = params.slug;

  const existing = await env.DB.prepare(
    'SELECT id FROM wiki_pages WHERE slug = ?',
  )
    .bind(slug)
    .first();

  if (!existing) {
    return Response.json({ error: 'Page not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM wiki_pages WHERE slug = ?')
    .bind(slug)
    .run();

  return new Response(null, { status: 204 });
};
