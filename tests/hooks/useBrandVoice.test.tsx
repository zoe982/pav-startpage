import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrandVoice } from '../../src/hooks/useBrandVoice.ts';
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

  it('stores error when API call fails', async () => {
    vi.mocked(listThreads).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Network down');
    expect(result.current.isLoading).toBe(false);
  });
});
