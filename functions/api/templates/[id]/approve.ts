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
    approvedByEmail: row.approved_by_email,
    approvedAt: row.approved_at,
  };
}

const SELECT_SQL = `SELECT t.id, t.title, t.type, t.subject, t.content,
    t.created_by, cu.name AS created_by_name,
    t.updated_by, uu.name AS updated_by_name,
    t.created_at, t.updated_at,
    t.approved_by_email, t.approved_at
  FROM templates t
  JOIN users cu ON t.created_by = cu.id
  JOIN users uu ON t.updated_by = uu.id
  WHERE t.id = ?`;

export const onRequestPost: PagesFunction<Env, 'id', AuthenticatedData> = async (context) => {
  const { env, params, data } = context;
  const denied = assertAppAccess(data.user, 'templates');
  if (denied) return denied;

  const id = params.id;

  await env.DB.prepare(
    `UPDATE templates SET approved_by_email = ?, approved_at = datetime('now') WHERE id = ?`,
  ).bind(data.user.email, id).run();

  const row = await env.DB.prepare(SELECT_SQL).bind(id).first<TemplateRow>();

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

  await env.DB.prepare(
    `UPDATE templates SET approved_by_email = NULL, approved_at = NULL WHERE id = ?`,
  ).bind(id).run();

  const row = await env.DB.prepare(SELECT_SQL).bind(id).first<TemplateRow>();

  if (!row) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  return Response.json(toTemplate(row));
};
