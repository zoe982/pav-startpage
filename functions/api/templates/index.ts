import type { Env, AuthenticatedData } from '../../types.ts';
import { assertAppAccess } from '../../types.ts';

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

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { env, request, data } = context;
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;
  const url = new URL(request.url);
  const typeFilter = url.searchParams.get('type');

  let sql = `SELECT t.id, t.title, t.type, t.subject, t.content,
      t.created_by, cu.name AS created_by_name,
      t.updated_by, uu.name AS updated_by_name,
      t.created_at, t.updated_at
    FROM templates t
    JOIN users cu ON t.created_by = cu.id
    JOIN users uu ON t.updated_by = uu.id`;

  const bindings: string[] = [];
  if (typeFilter === 'email' || typeFilter === 'whatsapp') {
    sql += ` WHERE (t.type = ? OR t.type = 'both')`;
    bindings.push(typeFilter);
  }

  sql += ' ORDER BY t.updated_at DESC';

  const stmt = env.DB.prepare(sql);
  const { results } = await (bindings.length
    ? stmt.bind(...bindings)
    : stmt
  ).all<TemplateRow>();

  const templates = results.map((row) => ({
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
  }));

  return Response.json(templates);
};

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env, data } = context;
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;

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

  const id = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const userId = data.user.id;

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO templates (id, title, type, subject, content, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, title, type, subject, content, userId, userId),
    env.DB.prepare(
      `INSERT INTO template_versions (id, template_id, version_number, title, type, subject, content, changed_by)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
    ).bind(versionId, id, title, type, subject, content, userId),
  ]);

  return Response.json(
    {
      id,
      title,
      type,
      subject,
      content,
      createdBy: userId,
      createdByName: data.user.name,
      updatedBy: userId,
      updatedByName: data.user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { status: 201 },
  );
};
