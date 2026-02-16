import type { Env } from '../../../types.ts';

interface VersionRow {
  id: string;
  version_number: number;
  title: string;
  type: string;
  subject: string | null;
  content: string;
  changed_by_name: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env, 'id'> = async (context) => {
  const { env, params } = context;
  const id = params.id;

  // Verify template exists
  const existing = await env.DB.prepare('SELECT id FROM templates WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  const { results } = await env.DB.prepare(
    `SELECT tv.id, tv.version_number, tv.title, tv.type, tv.subject, tv.content,
      u.name AS changed_by_name, tv.created_at
    FROM template_versions tv
    JOIN users u ON tv.changed_by = u.id
    WHERE tv.template_id = ?
    ORDER BY tv.version_number DESC`,
  )
    .bind(id)
    .all<VersionRow>();

  const versions = results.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    title: row.title,
    type: row.type,
    subject: row.subject,
    content: row.content,
    changedByName: row.changed_by_name,
    createdAt: row.created_at,
  }));

  return Response.json(versions);
};
