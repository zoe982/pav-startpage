import type { BrandMode, BrandRules, OutputStyle, RefineRequest, RewriteResult } from '../types/brandVoice.ts';
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
  signal?: AbortSignal,
  customStyleDescription?: string,
): Promise<RewriteResult> {
  const payload: { text: string; style: OutputStyle; mode: BrandMode; customStyleDescription?: string } = {
    text,
    style,
    mode,
  };
  if (customStyleDescription) {
    payload.customStyleDescription = customStyleDescription;
  }

  const options: RequestInit = {
    method: 'POST',
    body: JSON.stringify(payload),
  };
  if (signal) {
    options.signal = signal;
  }
  return await apiFetch<RewriteResult>('/api/brand-voice/rewrite', {
    ...options,
  });
}

export async function refineText(
  request: RefineRequest,
  signal?: AbortSignal,
): Promise<RewriteResult> {
  const payload: {
    text: string;
    style: OutputStyle;
    mode: BrandMode;
    customStyleDescription?: string;
    currentRewritten: string;
    feedback: string;
  } = {
    text: request.original,
    style: request.style,
    mode: request.mode,
    currentRewritten: request.currentRewritten,
    feedback: request.feedback,
  };
  if (request.customStyleDescription) {
    payload.customStyleDescription = request.customStyleDescription;
  }

  const options: RequestInit = {
    method: 'POST',
    body: JSON.stringify(payload),
  };
  if (signal) {
    options.signal = signal;
  }
  return await apiFetch<RewriteResult>('/api/brand-voice/rewrite', {
    ...options,
  });
}
