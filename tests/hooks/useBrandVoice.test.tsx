import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrandVoice } from '../../src/hooks/useBrandVoice.ts';
import { ApiError } from '../../src/api/client.ts';
import type { BrandVoiceThread } from '../../src/types/brandVoice.ts';

vi.mock('../../src/api/brandVoice.ts', () => ({
  listThreads: vi.fn(),
  getThread: vi.fn(),
  startThread: vi.fn(),
  replyInThread: vi.fn(),
  renameThread: vi.fn(),
  pinThreadDraft: vi.fn(),
}));

import {
  listThreads,
  getThread,
  startThread,
  replyInThread,
  renameThread,
  pinThreadDraft,
} from '../../src/api/brandVoice.ts';

function buildThread(overrides: Partial<BrandVoiceThread> = {}): BrandVoiceThread {
  return {
    id: 'thread-1',
    title: 'Welcome Email Draft (Zoey)',
    mode: 'draft',
    style: 'email',
    customStyleDescription: null,
    latestDraft: 'Body v1',
    pinnedDraft: null,
    messages: [
      { id: 'msg-1', role: 'user', content: 'Write a welcome email' },
      { id: 'msg-2', role: 'assistant', content: 'Drafted it.' },
    ],
    ...overrides,
  };
}

describe('useBrandVoice', () => {
  beforeEach(() => {
    vi.mocked(listThreads).mockReset();
    vi.mocked(getThread).mockReset();
    vi.mocked(startThread).mockReset();
    vi.mocked(replyInThread).mockReset();
    vi.mocked(renameThread).mockReset();
    vi.mocked(pinThreadDraft).mockReset();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useBrandVoice());

    expect(result.current.threads).toEqual([]);
    expect(result.current.activeThread).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadThreads populates shared threads', async () => {
    vi.mocked(listThreads).mockResolvedValue({
      threads: [
        { id: 'thread-1', title: 'T1' },
        { id: 'thread-2', title: 'T2' },
      ],
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.threads).toEqual([
      { id: 'thread-1', title: 'T1' },
      { id: 'thread-2', title: 'T2' },
    ]);
  });

  it('selectThread loads thread detail', async () => {
    vi.mocked(getThread).mockResolvedValue({ thread: buildThread() });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.selectThread('thread-1');
    });

    expect(vi.mocked(getThread)).toHaveBeenCalledWith('thread-1');
    expect(result.current.activeThread?.id).toBe('thread-1');
    expect(result.current.activeThread?.latestDraft).toBe('Body v1');
  });

  it('stores load-thread errors when selectThread fails', async () => {
    vi.mocked(getThread).mockRejectedValue(new ApiError(500, 'HTTP 500'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.selectThread('thread-1');
    });

    expect(result.current.error).toBe(
      'Failed to load thread. The service returned an unexpected error (HTTP 500). Please try again.',
    );
  });

  it('startThread creates and sets active thread while adding summary to list', async () => {
    vi.mocked(startThread).mockResolvedValue({
      thread: buildThread({ id: 'thread-3', title: 'New Thread (Zoey)' }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    expect(vi.mocked(startThread)).toHaveBeenCalledWith({
      text: 'Create a new draft',
      style: 'email',
      mode: 'draft',
    });
    const startPayload = vi.mocked(startThread).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(startPayload).toBeDefined();
    expect(Object.hasOwn(startPayload, 'customStyleDescription')).toBe(false);

    expect(result.current.activeThread?.id).toBe('thread-3');
    expect(result.current.threads[0]).toEqual({ id: 'thread-3', title: 'New Thread (Zoey)' });
  });

  it('startThread includes custom style description when provided', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'other', 'draft', 'Use this exact style');
    });

    expect(vi.mocked(startThread)).toHaveBeenCalledWith({
      text: 'Create a new draft',
      style: 'other',
      mode: 'draft',
      customStyleDescription: 'Use this exact style',
    });
  });

  it('sendMessage replies on current thread and updates active draft', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(replyInThread).mockResolvedValue({
      thread: buildThread({
        latestDraft: 'Body v2',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Write a welcome email' },
          { id: 'msg-2', role: 'assistant', content: 'Drafted it.' },
          { id: 'msg-3', role: 'user', content: 'Make it shorter' },
          { id: 'msg-4', role: 'assistant', content: 'I tightened the copy.' },
        ],
      }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.sendMessage('Make it shorter', 'email', 'draft');
    });

    expect(vi.mocked(replyInThread)).toHaveBeenCalledWith({
      threadId: 'thread-1',
      message: 'Make it shorter',
      style: 'email',
      mode: 'draft',
    });
    const replyPayload = vi.mocked(replyInThread).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(replyPayload).toBeDefined();
    expect(Object.hasOwn(replyPayload, 'customStyleDescription')).toBe(false);

    expect(result.current.activeThread?.latestDraft).toBe('Body v2');
    expect(result.current.activeThread?.messages.at(-1)).toEqual({
      id: 'msg-4',
      role: 'assistant',
      content: 'I tightened the copy.',
    });
  });

  it('sendMessage is a no-op without an active thread', async () => {
    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.sendMessage('No thread yet', 'email', 'draft');
    });

    expect(vi.mocked(replyInThread)).not.toHaveBeenCalled();
  });

  it('sendMessage omits optional fields when style and mode are not provided', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(replyInThread).mockResolvedValue({ thread: buildThread({ latestDraft: 'Body v3' }) });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.sendMessage('Keep this concise');
    });

    expect(vi.mocked(replyInThread)).toHaveBeenCalledWith({
      threadId: 'thread-1',
      message: 'Keep this concise',
    });
    const payload = vi.mocked(replyInThread).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(Object.hasOwn(payload, 'style')).toBe(false);
    expect(Object.hasOwn(payload, 'mode')).toBe(false);
    expect(Object.hasOwn(payload, 'customStyleDescription')).toBe(false);
  });

  it('sendMessage includes custom style description when provided', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(replyInThread).mockResolvedValue({ thread: buildThread({ latestDraft: 'Body v4' }) });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.sendMessage('Update format', 'other', 'rewrite', 'Use newsletter formatting');
    });

    expect(vi.mocked(replyInThread)).toHaveBeenCalledWith({
      threadId: 'thread-1',
      message: 'Update format',
      style: 'other',
      mode: 'rewrite',
      customStyleDescription: 'Use newsletter formatting',
    });
  });

  it('renameActiveThread updates active thread and summary title', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(renameThread).mockResolvedValue({
      thread: buildThread({ title: 'Final Welcome Draft' }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.renameActiveThread('Final Welcome Draft');
    });

    expect(vi.mocked(renameThread)).toHaveBeenCalledWith('thread-1', 'Final Welcome Draft');
    expect(result.current.activeThread?.title).toBe('Final Welcome Draft');
    expect(result.current.threads[0].title).toBe('Final Welcome Draft');
  });

  it('pinActiveDraft sets pinned draft on active thread', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(pinThreadDraft).mockResolvedValue({
      thread: buildThread({ pinnedDraft: 'Body v1' }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Create a new draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.pinActiveDraft();
    });

    expect(vi.mocked(pinThreadDraft)).toHaveBeenCalledWith('thread-1');
    expect(result.current.activeThread?.pinnedDraft).toBe('Body v1');
  });

  it('clearActiveThread clears selected thread', () => {
    const { result } = renderHook(() => useBrandVoice());

    act(() => {
      result.current.clearActiveThread();
    });

    expect(result.current.activeThread).toBeNull();
  });

  it('renameActiveThread is a no-op without an active thread', async () => {
    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.renameActiveThread('Ignored rename');
    });

    expect(vi.mocked(renameThread)).not.toHaveBeenCalled();
  });

  it('pinActiveDraft is a no-op without an active thread', async () => {
    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.pinActiveDraft();
    });

    expect(vi.mocked(pinThreadDraft)).not.toHaveBeenCalled();
  });

  it('stores error when API call fails', async () => {
    vi.mocked(listThreads).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Network down');
    expect(result.current.isLoading).toBe(false);
  });

  it('maps generic API errors to an actionable message', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(502, 'Request failed (HTTP 502)'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe(
      'Failed to load threads. The service returned an unexpected error (HTTP 502). Please try again.',
    );
  });

  it('maps generic API errors even when the server omits a closing parenthesis', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(502, 'Request failed (HTTP 502 Bad Gateway'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe(
      'Failed to load threads. The service returned an unexpected error (HTTP 502). Please try again.',
    );
  });

  it('keeps specific API error messages', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(404, 'Thread not found'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Thread not found');
  });

  it('maps network TypeError messages to connection guidance', async () => {
    vi.mocked(listThreads).mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Failed to load threads. Check your connection and try again.');
  });

  it('keeps non-network TypeError messages', async () => {
    vi.mocked(listThreads).mockRejectedValue(new TypeError('Request aborted by user'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Request aborted by user');
  });

  it('falls back when unknown error text is returned', async () => {
    vi.mocked(listThreads).mockRejectedValue(new Error('Unknown error'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Failed to load threads');
  });

  it('falls back for empty TypeError messages', async () => {
    vi.mocked(listThreads).mockRejectedValue(new TypeError(''));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Failed to load threads');
  });

  it('falls back when a non-Error value is thrown', async () => {
    vi.mocked(listThreads).mockRejectedValue('unexpected value');

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Failed to load threads');
  });

  it('stores start-thread specific failure message', async () => {
    vi.mocked(startThread).mockRejectedValue(new ApiError(500, 'HTTP 500'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Need copy', 'email', 'draft');
    });

    expect(result.current.error).toBe(
      'Failed to start thread. The service returned an unexpected error (HTTP 500). Please try again.',
    );
  });

  it('stores send-message specific failure message', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(replyInThread).mockRejectedValue(new ApiError(502, 'Request failed (HTTP 502 Bad Gateway)'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Initial draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.sendMessage('Revise this');
    });

    expect(result.current.error).toBe(
      'Failed to send message. The service returned an unexpected error (HTTP 502). Please try again.',
    );
  });

  it('stores rename-specific failure message', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(renameThread).mockRejectedValue(new Error('Rename denied'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Initial draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.renameActiveThread('Renamed');
    });

    expect(result.current.error).toBe('Rename denied');
  });

  it('stores pin-specific failure message', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(pinThreadDraft).mockRejectedValue(new Error('Pin failed'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread('Initial draft', 'email', 'draft');
    });

    await act(async () => {
      await result.current.pinActiveDraft();
    });

    expect(result.current.error).toBe('Pin failed');
  });
});
