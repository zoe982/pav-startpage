import type { Env, AuthenticatedData } from '../../types.ts';

interface BrandRulesBody {
  rulesMarkdown?: string;
  servicesMarkdown?: string;
}

interface BrandSettingsRow {
  rules_markdown: string;
  services_markdown: string;
  updated_at: string;
}

export const onRequestPut: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
  const { request, env } = context;
  const body: BrandRulesBody = await request.json();

  if (typeof body.rulesMarkdown !== 'string' && typeof body.servicesMarkdown !== 'string') {
    return Response.json(
      { error: 'rulesMarkdown or servicesMarkdown is required' },
      { status: 400 },
    );
  }

  // Build dynamic update to only touch provided fields
  const setClauses: string[] = ["updated_at = datetime('now')"];
  const values: string[] = [];

  if (typeof body.rulesMarkdown === 'string') {
    setClauses.push('rules_markdown = ?');
    values.push(body.rulesMarkdown);
  }
  if (typeof body.servicesMarkdown === 'string') {
    setClauses.push('services_markdown = ?');
    values.push(body.servicesMarkdown);
  }

  await env.DB.prepare(
    `UPDATE brand_settings SET ${setClauses.join(', ')} WHERE id = 1`,
  )
    .bind(...values)
    .run();

  const row = await env.DB.prepare(
    'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
  ).first<BrandSettingsRow>();

  return Response.json({
    rulesMarkdown: row?.rules_markdown ?? '',
    servicesMarkdown: row?.services_markdown ?? '',
    updatedAt: row?.updated_at ?? null,
  });
};
