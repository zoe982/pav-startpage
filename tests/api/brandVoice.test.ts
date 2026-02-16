import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBrandRules,
  updateBrandRules,
  rewriteText,
} from '../../src/api/brandVoice.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

import { apiFetch } from '../../src/api/client.ts';

beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
});

describe('fetchBrandRules', () => {
  it('calls apiFetch with /api/brand-rules', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ rulesMarkdown: '', servicesMarkdown: '', updatedAt: null });
    const result = await fetchBrandRules();
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-rules');
    expect(result).toEqual({ rulesMarkdown: '', servicesMarkdown: '', updatedAt: null });
  });
});

describe('updateBrandRules', () => {
  it('calls apiFetch with PUT and body', async () => {
    const data = { rulesMarkdown: '# Rules', servicesMarkdown: '# Services' };
    vi.mocked(apiFetch).mockResolvedValue({ ...data, updatedAt: '2025-01-01' });
    const result = await updateBrandRules(data);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/brand-rules', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    expect(result).toEqual({ ...data, updatedAt: '2025-01-01' });
  });
});

describe('rewriteText', () => {
  it('calls apiFetch with POST and body including style and mode', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
    const result = await rewriteText('Hi', 'email', 'rewrite');
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hi', style: 'email', mode: 'rewrite' }),
    });
    expect(result).toEqual({ original: 'Hi', rewritten: 'Hello' });
  });

  it('passes draft mode correctly', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Write a bio', rewritten: 'A bio...' });
    await rewriteText('Write a bio', 'whatsapp', 'draft');
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text: 'Write a bio', style: 'whatsapp', mode: 'draft' }),
    });
  });
});
