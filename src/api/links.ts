import type { Link, LinkFormData } from '../types/link.ts';
import { apiFetch } from './client.ts';

export async function fetchLinks(): Promise<Link[]> {
  return await apiFetch<Link[]>('/api/links');
}

export async function fetchAdminLinks(): Promise<Link[]> {
  return await apiFetch<Link[]>('/api/admin/links');
}

export async function fetchAdminLink(id: string): Promise<Link> {
  return await apiFetch<Link>(`/api/admin/links/${id}`);
}

export async function createLink(data: LinkFormData): Promise<Link> {
  return await apiFetch<Link>('/api/admin/links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLink(id: string, data: LinkFormData): Promise<Link> {
  return await apiFetch<Link>(`/api/admin/links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLink(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/admin/links/${id}`, { method: 'DELETE' });
}
