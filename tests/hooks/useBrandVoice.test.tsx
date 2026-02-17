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
  saveThreadDraft: vi.fn(),
  restoreThreadDraftVersion: vi.fn(),
}));

import {
  listThreads,
  getThread,
  startThread,
  replyInThread,
  renameThread,
  pinThreadDraft,
  saveThreadDraft,
  restoreThreadDraftVersion,
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
    draftVersions: [
      {
        id: 'version-1',
        versionNumber: 1,
        draftText: 'Body v1',
        source: 'assistant',
        createdAt: '2026-02-17T12:00:00.000Z',
        createdByName: 'Brand Voice Colleague',
      },
    ],
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
    vi.mocked(saveThreadDraft).mockReset();
    vi.mocked(restoreThreadDraftVersion).mockReset();
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
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    expect(vi.mocked(startThread)).toHaveBeenCalledWith({
      goal: 'Create a new draft',
      noDraftProvided: true,
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
      await result.current.startThread({
        goal: 'Create a new draft',
        roughDraft: 'Existing source',
        noDraftProvided: false,
        style: 'other',
        mode: 'draft',
        customStyleDescription: 'Use this exact style',
      });
    });

    expect(vi.mocked(startThread)).toHaveBeenCalledWith({
      goal: 'Create a new draft',
      roughDraft: 'Existing source',
      noDraftProvided: false,
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
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.sendMessage('Make it shorter');
    });

    expect(vi.mocked(replyInThread)).toHaveBeenCalledWith({
      threadId: 'thread-1',
      message: 'Make it shorter',
    });
    const replyPayload = vi.mocked(replyInThread).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(replyPayload).toBeDefined();
    expect(Object.keys(replyPayload)).toEqual(['threadId', 'message']);

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
      await result.current.sendMessage('No thread yet');
    });

    expect(vi.mocked(replyInThread)).not.toHaveBeenCalled();
  });

  it('sendMessage posts only required fields', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(replyInThread).mockResolvedValue({ thread: buildThread({ latestDraft: 'Body v3' }) });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
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
    expect(Object.keys(payload)).toEqual(['threadId', 'message']);
  });

  it('renameActiveThread updates active thread and summary title', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(renameThread).mockResolvedValue({
      thread: buildThread({ title: 'Final Welcome Draft' }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
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
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.pinActiveDraft();
    });

    expect(vi.mocked(pinThreadDraft)).toHaveBeenCalledWith('thread-1');
    expect(result.current.activeThread?.pinnedDraft).toBe('Body v1');
  });

  it('saveActiveDraft persists draft text and updates versions', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(saveThreadDraft).mockResolvedValue({
      thread: buildThread({
        latestDraft: 'Body v2',
        draftVersions: [
          {
            id: 'version-2',
            versionNumber: 2,
            draftText: 'Body v2',
            source: 'manual',
            createdAt: '2026-02-17T12:10:00.000Z',
            createdByName: 'Test User',
          },
          ...buildThread().draftVersions,
        ],
      }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.saveActiveDraft('Body v2');
    });

    expect(vi.mocked(saveThreadDraft)).toHaveBeenCalledWith('thread-1', 'Body v2');
    expect(result.current.activeThread?.latestDraft).toBe('Body v2');
    expect(result.current.activeThread?.draftVersions[0]?.id).toBe('version-2');
  });

  it('restoreActiveDraftVersion restores a prior version', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(restoreThreadDraftVersion).mockResolvedValue({
      thread: buildThread({
        latestDraft: 'Body v0',
        draftVersions: [
          {
            id: 'version-3',
            versionNumber: 3,
            draftText: 'Body v0',
            source: 'restore',
            createdAt: '2026-02-17T12:20:00.000Z',
            createdByName: 'Test User',
          },
          ...buildThread().draftVersions,
        ],
      }),
    });

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Create a new draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.restoreActiveDraftVersion('version-1');
    });

    expect(vi.mocked(restoreThreadDraftVersion)).toHaveBeenCalledWith('thread-1', 'version-1');
    expect(result.current.activeThread?.latestDraft).toBe('Body v0');
    expect(result.current.activeThread?.draftVersions[0]?.source).toBe('restore');
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

  it('saveActiveDraft is a no-op without an active thread', async () => {
    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.saveActiveDraft('Body v2');
    });

    expect(vi.mocked(saveThreadDraft)).not.toHaveBeenCalled();
  });

  it('restoreActiveDraftVersion is a no-op without an active thread', async () => {
    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.restoreActiveDraftVersion('version-1');
    });

    expect(vi.mocked(restoreThreadDraftVersion)).not.toHaveBeenCalled();
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

  it('treats malformed short HTTP status messages as specific errors', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(500, 'HTTP 50'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('HTTP 50');
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

  it('treats request-failed messages with invalid status digits as specific errors', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(500, 'Request failed (HTTP A12)'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Request failed (HTTP A12)');
  });

  it('treats request-failed messages without a space after status as specific errors', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(500, 'Request failed (HTTP 502Bad Gateway)'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Request failed (HTTP 502Bad Gateway)');
  });

  it('treats request-failed messages with missing status digits as specific errors', async () => {
    vi.mocked(listThreads).mockRejectedValue(new ApiError(500, 'Request failed (HTTP )'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.loadThreads();
    });

    expect(result.current.error).toBe('Request failed (HTTP )');
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
      await result.current.startThread({
        goal: 'Need copy',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
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
      await result.current.startThread({
        goal: 'Initial draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
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
      await result.current.startThread({
        goal: 'Initial draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
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
      await result.current.startThread({
        goal: 'Initial draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.pinActiveDraft();
    });

    expect(result.current.error).toBe('Pin failed');
  });

  it('stores save-draft specific failure message', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(saveThreadDraft).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Initial draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.saveActiveDraft('Body v2');
    });

    expect(result.current.error).toBe('Save failed');
  });

  it('stores restore-version specific failure message', async () => {
    vi.mocked(startThread).mockResolvedValue({ thread: buildThread() });
    vi.mocked(restoreThreadDraftVersion).mockRejectedValue(new Error('Restore failed'));

    const { result } = renderHook(() => useBrandVoice());

    await act(async () => {
      await result.current.startThread({
        goal: 'Initial draft',
        noDraftProvided: true,
        style: 'email',
        mode: 'draft',
      });
    });

    await act(async () => {
      await result.current.restoreActiveDraftVersion('version-1');
    });

    expect(result.current.error).toBe('Restore failed');
  });

});
