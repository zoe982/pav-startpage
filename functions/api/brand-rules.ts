import type { Env } from '../types.ts';

interface BrandSettingsRow {
  rules_markdown: string;
  services_markdown: string;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const row = await env.DB.prepare(
    'SELECT rules_markdown, services_markdown, updated_at FROM brand_settings WHERE id = 1',
  ).first<BrandSettingsRow>();

  return Response.json({
    rulesMarkdown: row?.rules_markdown ?? '',
    servicesMarkdown: row?.services_markdown ?? '',
    updatedAt: row?.updated_at ?? null,
  });
};
