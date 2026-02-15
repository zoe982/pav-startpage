import type { Env, AuthenticatedData } from '../../../types.ts';

interface WikiRow {
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const { results } = await env.DB.prepare(
    'SELECT id, slug, title, is_published, show_on_start, sort_order FROM wiki_pages ORDER BY sort_order ASC, title ASC',
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

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  const body: WikiBody = await request.json();

  if (!body.title || !body.slug || !body.content) {
    return Response.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 },
    );
  }

  // Check slug uniqueness
  const existing = await env.DB.prepare(
    'SELECT id FROM wiki_pages WHERE slug = ?',
  )
    .bind(body.slug)
    .first();

  if (existing) {
    return Response.json({ error: 'Slug already exists' }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO wiki_pages (id, slug, title, content, is_published, show_on_start, sort_order, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      body.slug,
      body.title,
      body.content,
      body.isPublished ? 1 : 0,
      body.showOnStart ? 1 : 0,
      body.sortOrder ?? 0,
      data.user.id,
    )
    .run();

  return Response.json(
    {
      id,
      slug: body.slug,
      title: body.title,
      content: body.content,
      isPublished: body.isPublished ?? false,
      showOnStart: body.showOnStart ?? false,
      sortOrder: body.sortOrder ?? 0,
    },
    { status: 201 },
  );
};
