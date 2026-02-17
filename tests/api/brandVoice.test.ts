import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBrandRules,
  updateBrandRules,
  rewriteText,
  refineText,
  listThreads,
  getThread,
  startThread,
  replyInThread,
  renameThread,
  pinThreadDraft,
} from '../../src/api/brandVoice.ts';

vi.mock('../../src/api/client.ts', () => ({
  apiFetch: vi.fn(),
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
    const payload = { rulesMarkdown: '# Rules', servicesMarkdown: '# Services' };
    vi.mocked(apiFetch).mockResolvedValue({ ...payload, updatedAt: '2026-02-17T00:00:00.000Z' });

    const result = await updateBrandRules(payload);

    expect(apiFetch).toHaveBeenCalledWith('/api/admin/brand-rules', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual({ ...payload, updatedAt: '2026-02-17T00:00:00.000Z' });
  });
});

describe('rewriteText', () => {
  it('posts rewrite payload without optional fields', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'A', rewritten: 'B' });

    const result = await rewriteText('A', 'email', 'rewrite');

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'A',
        style: 'email',
        mode: 'rewrite',
      }),
    });
    expect(result).toEqual({ original: 'A', rewritten: 'B' });
  });

  it('includes optional custom style and abort signal when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'A', rewritten: 'B' });
    const controller = new AbortController();

    await rewriteText('A', 'other', 'draft', controller.signal, 'Friendly and concise');

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'A',
        style: 'other',
        mode: 'draft',
        customStyleDescription: 'Friendly and concise',
      }),
      signal: controller.signal,
    });
  });
});

describe('refineText', () => {
  it('posts refinement payload without optional custom style', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'A', rewritten: 'B' });

    const result = await refineText({
      original: 'A',
      currentRewritten: 'Current',
      feedback: 'Shorter please',
      style: 'email',
      mode: 'rewrite',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'A',
        style: 'email',
        mode: 'rewrite',
        currentRewritten: 'Current',
        feedback: 'Shorter please',
      }),
    });
    expect(result).toEqual({ original: 'A', rewritten: 'B' });
  });

  it('includes optional custom style and abort signal when provided', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ original: 'A', rewritten: 'B' });
    const controller = new AbortController();

    await refineText(
      {
        original: 'A',
        currentRewritten: 'Current',
        feedback: 'Shorter please',
        style: 'other',
        mode: 'draft',
        customStyleDescription: 'Less formal',
      },
      controller.signal,
    );

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        text: 'A',
        style: 'other',
        mode: 'draft',
        currentRewritten: 'Current',
        feedback: 'Shorter please',
        customStyleDescription: 'Less formal',
      }),
      signal: controller.signal,
    });
  });
});

describe('thread APIs', () => {
  it('lists threads', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ threads: [{ id: 'thread-1', title: 'T1' }] });

    const result = await listThreads();

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite');
    expect(result).toEqual({ threads: [{ id: 'thread-1', title: 'T1' }] });
  });

  it('fetches a thread by id', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1' } });

    const result = await getThread('thread-1');

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite?threadId=thread-1');
    expect(result).toEqual({ thread: { id: 'thread-1' } });
  });

  it('starts a thread', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1' } });

    const result = await startThread({
      text: 'Draft this',
      style: 'email',
      mode: 'draft',
      customStyleDescription: 'Friendly',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'start',
        text: 'Draft this',
        style: 'email',
        mode: 'draft',
        customStyleDescription: 'Friendly',
      }),
    });
    expect(result).toEqual({ thread: { id: 'thread-1' } });
  });

  it('starts a thread without optional custom style description', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-2' } });

    await startThread({
      text: 'Draft this without custom style',
      style: 'document',
      mode: 'rewrite',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'start',
        text: 'Draft this without custom style',
        style: 'document',
        mode: 'rewrite',
      }),
    });
  });

  it('replies in a thread', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1' } });

    const result = await replyInThread({
      threadId: 'thread-1',
      message: 'Make it shorter',
      style: 'email',
      mode: 'draft',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reply',
        threadId: 'thread-1',
        message: 'Make it shorter',
        style: 'email',
        mode: 'draft',
      }),
    });
    expect(result).toEqual({ thread: { id: 'thread-1' } });
  });

  it('replies with only required fields plus custom style description', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1' } });

    await replyInThread({
      threadId: 'thread-1',
      message: 'Use this custom output format',
      customStyleDescription: 'Bullet points with short headings',
    });

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reply',
        threadId: 'thread-1',
        message: 'Use this custom output format',
        customStyleDescription: 'Bullet points with short headings',
      }),
    });
  });

  it('renames a thread', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1', title: 'Renamed' } });

    const result = await renameThread('thread-1', 'Renamed');

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'rename',
        threadId: 'thread-1',
        title: 'Renamed',
      }),
    });
    expect(result).toEqual({ thread: { id: 'thread-1', title: 'Renamed' } });
  });

  it('pins latest draft for a thread', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ thread: { id: 'thread-1', pinnedDraft: 'Body' } });

    const result = await pinThreadDraft('thread-1');

    expect(apiFetch).toHaveBeenCalledWith('/api/brand-voice/rewrite', {
      method: 'POST',
      body: JSON.stringify({
        action: 'pin',
        threadId: 'thread-1',
      }),
    });
    expect(result).toEqual({ thread: { id: 'thread-1', pinnedDraft: 'Body' } });
  });
});
