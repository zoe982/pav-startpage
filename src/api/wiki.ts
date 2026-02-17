import type { WikiPage, WikiPageSummary, WikiFormData } from '../types/wiki.ts';
import { apiFetch } from './client.ts';

export async function fetchWikiPages(): Promise<WikiPageSummary[]> {
  return await apiFetch<WikiPageSummary[]>('/api/wiki');
}

export async function fetchWikiPage(slug: string): Promise<WikiPage> {
  return await apiFetch<WikiPage>(`/api/wiki/${slug}`);
}

export async function fetchAdminWikiPages(): Promise<WikiPageSummary[]> {
  return await apiFetch<WikiPageSummary[]>('/api/admin/wiki');
}

export async function fetchAdminWikiPage(slug: string): Promise<WikiPage> {
  return await apiFetch<WikiPage>(`/api/admin/wiki/${slug}`);
}

export async function createWikiPage(data: WikiFormData): Promise<WikiPage> {
  return await apiFetch<WikiPage>('/api/admin/wiki', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWikiPage(slug: string, data: WikiFormData): Promise<WikiPage> {
  return await apiFetch<WikiPage>(`/api/admin/wiki/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteWikiPage(slug: string): Promise<void> {
  await apiFetch<undefined>(`/api/admin/wiki/${slug}`, { method: 'DELETE' });
}
