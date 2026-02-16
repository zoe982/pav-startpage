import type { BrandMode, BrandRules, OutputStyle, RewriteResult } from '../types/brandVoice.ts';
import { apiFetch } from './client.ts';

export async function fetchBrandRules(): Promise<BrandRules> {
  return await apiFetch<BrandRules>('/api/brand-rules');
}

export async function updateBrandRules(data: {
  rulesMarkdown?: string;
  servicesMarkdown?: string;
}): Promise<BrandRules> {
  return await apiFetch<BrandRules>('/api/admin/brand-rules', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function rewriteText(
  text: string,
  style: OutputStyle,
  mode: BrandMode,
): Promise<RewriteResult> {
  return await apiFetch<RewriteResult>('/api/brand-voice/rewrite', {
    method: 'POST',
    body: JSON.stringify({ text, style, mode }),
  });
}
