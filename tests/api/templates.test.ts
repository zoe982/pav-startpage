import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchTemplateVersions,
} from '../../src/api/templates.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../src/api/client.ts';

beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
});

describe('fetchTemplates', () => {
  it('calls templates endpoint without query by default', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchTemplates();
    expect(apiFetch).toHaveBeenCalledWith('/api/templates');
    expect(result).toEqual([]);
  });

  it('calls templates endpoint with type query', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    await fetchTemplates('email');
    expect(apiFetch).toHaveBeenCalledWith('/api/templates?type=email');
  });
});

describe('fetchTemplate', () => {
  it('calls template details endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 'template-1' });
    const result = await fetchTemplate('template-1');
    expect(apiFetch).toHaveBeenCalledWith('/api/templates/template-1');
    expect(result).toEqual({ id: 'template-1' });
  });
});

describe('createTemplate', () => {
  it('posts template form data', async () => {
    const formData = {
      title: 'Welcome',
      type: 'email',
      subject: 'Welcome {{client_name}}',
      content: 'Hi {{client_name}}',
    } as const;

    vi.mocked(apiFetch).mockResolvedValue({ id: 'template-1', ...formData });
    const result = await createTemplate(formData);

    expect(apiFetch).toHaveBeenCalledWith('/api/templates', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    expect(result).toEqual({ id: 'template-1', ...formData });
  });
});

describe('updateTemplate', () => {
  it('puts template form data', async () => {
    const formData = {
      title: 'Welcome',
      type: 'whatsapp',
      subject: 'Update {{client_name}}',
      content: 'Hi {{client_name}}',
    } as const;

    vi.mocked(apiFetch).mockResolvedValue({ id: 'template-1', ...formData });
    const result = await updateTemplate('template-1', formData);

    expect(apiFetch).toHaveBeenCalledWith('/api/templates/template-1', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    expect(result).toEqual({ id: 'template-1', ...formData });
  });
});

describe('deleteTemplate', () => {
  it('deletes a template', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);
    await deleteTemplate('template-1');
    expect(apiFetch).toHaveBeenCalledWith('/api/templates/template-1', { method: 'DELETE' });
  });
});

describe('fetchTemplateVersions', () => {
  it('calls versions endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    const result = await fetchTemplateVersions('template-1');
    expect(apiFetch).toHaveBeenCalledWith('/api/templates/template-1/versions');
    expect(result).toEqual([]);
  });
});
