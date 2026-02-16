import type { Template, TemplateFormData, TemplateVersion } from '../types/template.ts';
import { apiFetch } from './client.ts';

export async function fetchTemplates(type?: string): Promise<Template[]> {
  const query = type ? `?type=${type}` : '';
  return await apiFetch<Template[]>(`/api/templates${query}`);
}

export async function fetchTemplate(id: string): Promise<Template> {
  return await apiFetch<Template>(`/api/templates/${id}`);
}

export async function createTemplate(data: TemplateFormData): Promise<Template> {
  return await apiFetch<Template>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id: string, data: TemplateFormData): Promise<Template> {
  return await apiFetch<Template>(`/api/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/templates/${id}`, { method: 'DELETE' });
}

export async function fetchTemplateVersions(id: string): Promise<TemplateVersion[]> {
  return await apiFetch<TemplateVersion[]>(`/api/templates/${id}/versions`);
}
