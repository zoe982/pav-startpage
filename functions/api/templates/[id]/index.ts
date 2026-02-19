import type { Env, AuthenticatedData } from '../../../types.ts';
import { assertAppAccess } from '../../../types.ts';

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
  approved_by_email: string | null;
  approved_at: string | null;
}

interface TemplateResponse {
  id: string;
  title: string;
  type: string;
  subject: string | null;
  content: string;
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  approvedByEmail: string | null;
  approvedAt: string | null;
}

function toTemplate(row: TemplateRow): TemplateResponse {
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
    approvedByEmail: row.approved_by_email,
    approvedAt: row.approved_at,
  };
}

export const onRequestGet: PagesFunction<Env, 'id', AuthenticatedData> = async (context) => {
  const { env, params, data } = context;
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;

  const id = params.id;

  const row = await env.DB.prepare(
    `SELECT t.id, t.title, t.type, t.subject, t.content,
      t.created_by, cu.name AS created_by_name,
      t.updated_by, uu.name AS updated_by_name,
      t.created_at, t.updated_at,
      t.approved_by_email, t.approved_at
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
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;

  const id = params.id;
  const body: unknown = await request.json();
  if (body === null || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const bodyRecord = body as Record<string, unknown>;
  const titleRaw = bodyRecord['title'];
  const typeRaw = bodyRecord['type'];
  const subjectRaw = bodyRecord['subject'];
  const contentRaw = bodyRecord['content'];
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';
  const type = typeof typeRaw === 'string' ? typeRaw : '';
  const subject = typeof subjectRaw === 'string' ? subjectRaw.trim() : null;
  const content = typeof contentRaw === 'string' ? contentRaw : '';

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }
  if (type !== 'email' && type !== 'whatsapp' && type !== 'both') {
    return Response.json({ error: 'Type must be email, whatsapp, or both' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT id, title, type, subject, content, approved_by_email FROM templates WHERE id = ?',
  )
    .bind(id)
    .first<{ id: string; title: string; type: string; subject: string | null; content: string; approved_by_email: string | null }>();

  if (!existing) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  const contentChanged =
    existing.title !== title ||
    existing.type !== type ||
    (existing.subject ?? '') !== (subject ?? '') ||
    existing.content !== content;
  const shouldClearApproval = contentChanged && existing.approved_by_email !== null;

  // Get current max version number
  const maxRow = await env.DB.prepare(
    'SELECT MAX(version_number) AS max_ver FROM template_versions WHERE template_id = ?',
  )
    .bind(id)
    .first<{ max_ver: number | null }>();

  const nextVersion = (maxRow?.max_ver ?? 0) + 1;
  const versionId = crypto.randomUUID();
  const userId = data.user.id;

  const updateSql = shouldClearApproval
    ? `UPDATE templates
       SET title = ?, type = ?, subject = ?, content = ?, updated_by = ?, updated_at = datetime('now'),
           approved_by_email = NULL, approved_at = NULL
       WHERE id = ?`
    : `UPDATE templates
       SET title = ?, type = ?, subject = ?, content = ?, updated_by = ?, updated_at = datetime('now')
       WHERE id = ?`;

  await env.DB.batch([
    env.DB.prepare(updateSql).bind(title, type, subject, content, userId, id),
    env.DB.prepare(
      `INSERT INTO template_versions (id, template_id, version_number, title, type, subject, content, changed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(versionId, id, nextVersion, title, type, subject, content, userId),
  ]);

  // Return updated template
  const row = await env.DB.prepare(
    `SELECT t.id, t.title, t.type, t.subject, t.content,
      t.created_by, cu.name AS created_by_name,
      t.updated_by, uu.name AS updated_by_name,
      t.created_at, t.updated_at,
      t.approved_by_email, t.approved_at
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

export const onRequestDelete: PagesFunction<Env, 'id', AuthenticatedData> = async (context) => {
  const { env, params, data } = context;
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;

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
