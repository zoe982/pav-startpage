import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBrandRules,
  updateBrandRules,
  rewriteText,
  refineText,
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
      body: JSON.stringify({ text: 'Hi', style: 'email', mode: 'rewrite', customStyleDescription: undefined }),
      signal: undefined,
    });
    expect(result).toEqual({ original: 'Hi', rewritten: 'Hello' });
  });

  it('passes draft mode correctly', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Write a bio', rewritten: 'A bio...' });
    await rewriteText('Write a bio', 'whatsapp', 'draft');
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text: 'Write a bio', style: 'whatsapp', mode: 'draft', customStyleDescription: undefined }),
      signal: undefined,
    });
  });

  it('passes AbortSignal when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
    const controller = new AbortController();
    await rewriteText('Hi', 'email', 'rewrite', controller.signal);
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hi', style: 'email', mode: 'rewrite', customStyleDescription: undefined }),
      signal: controller.signal,
    });
  });

  it('passes customStyleDescription when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
    await rewriteText('Hi', 'other', 'rewrite', undefined, 'Instagram caption');
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hi', style: 'other', mode: 'rewrite', customStyleDescription: 'Instagram caption' }),
      signal: undefined,
    });
  });
});

describe('refineText', () => {
  it('calls apiFetch with refinement fields', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hello, revised' });
    const result = await refineText({
      original: 'Hi',
      currentRewritten: 'Hello',
      feedback: 'Make it shorter',
      style: 'email',
      mode: 'rewrite',
    });
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Hi',
        style: 'email',
        mode: 'rewrite',
        customStyleDescription: undefined,
        currentRewritten: 'Hello',
        feedback: 'Make it shorter',
      }),
      signal: undefined,
    });
    expect(result).toEqual({ original: 'Hi', rewritten: 'Hello, revised' });
  });

  it('passes customStyleDescription through refinement', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hey!' });
    await refineText({
      original: 'Hi',
      currentRewritten: 'Hello',
      feedback: 'More casual',
      style: 'other',
      mode: 'rewrite',
      customStyleDescription: 'Slack message',
    });
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Hi',
        style: 'other',
        mode: 'rewrite',
        customStyleDescription: 'Slack message',
        currentRewritten: 'Hello',
        feedback: 'More casual',
      }),
      signal: undefined,
    });
  });

  it('passes AbortSignal when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'Hi', rewritten: 'Hey' });
    const controller = new AbortController();
    await refineText({
      original: 'Hi',
      currentRewritten: 'Hello',
      feedback: 'Shorter',
      style: 'email',
      mode: 'rewrite',
    }, controller.signal);
    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: expect.any(String),
      signal: controller.signal,
    });
  });
});
