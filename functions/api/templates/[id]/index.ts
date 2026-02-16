import type { Env, AuthenticatedData } from '../../../types.ts';

interface TemplateRow {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  content: string;
  created_by: string;
  created_by_name: string;
  updated_by: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

interface TemplateBody {
  title: string;
  type: 'email' | 'whatsapp';
  subject?: string;
  content: string;
}

function toTemplate(row: TemplateRow) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    subject: row.subject,
    content: row.content,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    updatedBy: row.updated_by,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const onRequestGet: PagesFunction<Env, 'id'> = async (context) => {
  const { env, params } = context;
  const id = params.id;

  const row = await env.DB.prepare(
    `SELECT t.id, t.title, t.type, t.subject, t.content,
      t.created_by, cu.name AS created_by_name,
      t.updated_by, uu.name AS updated_by_name,
      t.created_at, t.updated_at
    FROM templates t
    JOIN users cu ON t.created_by = cu.id
    JOIN users uu ON t.updated_by = uu.id
    WHERE t.id = ?`,
  )
    .bind(id)
    .first<TemplateRow>();

  if (!row) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  return Response.json(toTemplate(row));
};

export const onRequestPut: PagesFunction<Env, 'id', AuthenticatedData> = async (context) => {
  const { request, env, params, data } = context;
  const id = params.id;
  const body: TemplateBody = await request.json();

  if (!body.title?.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }
  if (body.type !== 'email' && body.type !== 'whatsapp') {
    return Response.json({ error: 'Type must be email or whatsapp' }, { status: 400 });
  }

  const existing = await env.DB.prepare('SELECT id FROM templates WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  // Get current max version number
  const maxRow = await env.DB.prepare(
    'SELECT MAX(version_number) AS max_ver FROM template_versions WHERE template_id = ?',
  )
    .bind(id)
    .first<{ max_ver: number | null }>();

  const nextVersion = (maxRow?.max_ver ?? 0) + 1;
  const versionId = crypto.randomUUID();
  const userId = data.user.id;

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE templates
       SET title = ?, type = ?, subject = ?, content = ?, updated_by = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(body.title.trim(), body.type, body.subject?.trim() ?? null, body.content ?? '', userId, id),
    env.DB.prepare(
      `INSERT INTO template_versions (id, template_id, version_number, title, type, subject, content, changed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(versionId, id, nextVersion, body.title.trim(), body.type, body.subject?.trim() ?? null, body.content ?? '', userId),
  ]);

  // Return updated template
  const row = await env.DB.prepare(
    `SELECT t.id, t.title, t.type, t.subject, t.content,
      t.created_by, cu.name AS created_by_name,
      t.updated_by, uu.name AS updated_by_name,
      t.created_at, t.updated_at
    FROM templates t
    JOIN users cu ON t.created_by = cu.id
    JOIN users uu ON t.updated_by = uu.id
    WHERE t.id = ?`,
  )
    .bind(id)
    .first<TemplateRow>();

  return Response.json(toTemplate(row!));
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async (context) => {
  const { env, params } = context;
  const id = params.id;

  const existing = await env.DB.prepare('SELECT id FROM templates WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();

  return new Response(null, { status: 204 });
};
