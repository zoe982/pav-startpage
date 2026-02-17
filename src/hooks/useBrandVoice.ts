import { useCallback, useState } from 'react';
import type {
  BrandVoiceThread,
  BrandVoiceThreadSummary,
  ReplyThreadRequest,
  StartThreadRequest,
} from '../types/brandVoice.ts';
import { ApiError } from '../api/client.ts';
import {
  listThreads,
  getThread,
  startThread as startThreadRequest,
  replyInThread as replyInThreadRequest,
  renameThread as renameThreadRequest,
  pinThreadDraft as pinThreadDraftRequest,
  saveThreadDraft as saveThreadDraftRequest,
  restoreThreadDraftVersion as restoreThreadDraftVersionRequest,
} from '../api/brandVoice.ts';

interface UseBrandVoiceReturn {
  readonly threads: readonly BrandVoiceThreadSummary[];
  readonly activeThread: BrandVoiceThread | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadThreads: () => Promise<void>;
  readonly selectThread: (threadId: string) => Promise<void>;
  readonly startThread: (request: StartThreadRequest) => Promise<void>;
  readonly sendMessage: (message: string) => Promise<void>;
  readonly renameActiveThread: (title: string) => Promise<void>;
  readonly pinActiveDraft: () => Promise<void>;
  readonly saveActiveDraft: (draftText: string) => Promise<void>;
  readonly restoreActiveDraftVersion: (versionId: string) => Promise<void>;
  readonly clearActiveThread: () => void;
}

function normalizeErrorMessage(message: string): string | null {
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isThreeDigitStatusCode(value: string): boolean {
  if (value.length !== 3) return false;

  return value.split('').every((char) => char >= '0' && char <= '9');
}

function isGenericHttpMessage(message: string): boolean {
  const prefix = 'http ';
  if (!message.startsWith(prefix)) return false;

  return isThreeDigitStatusCode(message.slice(prefix.length));
}

function isGenericRequestFailedMessage(message: string): boolean {
  const prefix = 'request failed (http ';
  if (!message.startsWith(prefix)) return false;

  const payload = message.slice(prefix.length);
  if (payload.length < 3) return false;

  const statusCode = payload.slice(0, 3);
  if (!isThreeDigitStatusCode(statusCode)) return false;

  const details = payload.slice(3);
  if (details.length === 0 || details === ')') return true;
  if (!details.startsWith(' ')) return false;

  const detailText = details.endsWith(')')
    ? details.slice(1, -1)
    : details.slice(1);

  return detailText.trim().length > 0;
}

function isGenericApiMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized === 'unknown error'
    || isGenericHttpMessage(normalized)
    || isGenericRequestFailedMessage(normalized);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const normalized = normalizeErrorMessage(error.message);
    if (normalized && !isGenericApiMessage(normalized)) {
      return normalized;
    }
    return `${fallback}. The service returned an unexpected error (HTTP ${error.status}). Please try again.`;
  }

  if (error instanceof TypeError) {
    const normalized = normalizeErrorMessage(error.message);
    if (normalized && /fetch|network/i.test(normalized)) {
      return `${fallback}. Check your connection and try again.`;
    }
    if (normalized) return normalized;
  }

  if (error instanceof Error) {
    const normalized = normalizeErrorMessage(error.message);
    if (normalized && normalized.toLowerCase() !== 'unknown error') {
      return normalized;
    }
  }

  return fallback;
}

export function useBrandVoice(): UseBrandVoiceReturn {
  const [threads, setThreads] = useState<readonly BrandVoiceThreadSummary[]>([]);
  const [activeThread, setActiveThread] = useState<BrandVoiceThread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyThreadUpdate = useCallback((thread: BrandVoiceThread) => {
    setActiveThread(thread);
    setThreads((previous) => {
      const summary = { id: thread.id, title: thread.title } as const;
      const withoutCurrent = previous.filter((item) => item.id !== thread.id);
      return [summary, ...withoutCurrent];
    });
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listThreads();
      setThreads(response.threads);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load threads'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectThread = useCallback(async (threadId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getThread(threadId);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load thread'));
    } finally {
      setIsLoading(false);
    }
  }, [applyThreadUpdate]);

  const startThread = useCallback(async (request: StartThreadRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await startThreadRequest(request);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to start thread'));
    } finally {
      setIsLoading(false);
    }
  }, [applyThreadUpdate]);

  const sendMessage = useCallback(async (message: string) => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const payload: ReplyThreadRequest = {
        threadId: activeThread.id,
        message,
      };
      const response = await replyInThreadRequest(payload);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to send message'));
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, applyThreadUpdate]);

  const renameActiveThread = useCallback(async (title: string) => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await renameThreadRequest(activeThread.id, title);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to rename thread'));
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, applyThreadUpdate]);

  const pinActiveDraft = useCallback(async () => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await pinThreadDraftRequest(activeThread.id);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to pin draft'));
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, applyThreadUpdate]);

  const saveActiveDraft = useCallback(async (draftText: string) => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await saveThreadDraftRequest(activeThread.id, draftText);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to save draft'));
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, applyThreadUpdate]);

  const restoreActiveDraftVersion = useCallback(async (versionId: string) => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await restoreThreadDraftVersionRequest(activeThread.id, versionId);
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to restore version'));
    } finally {
      setIsLoading(false);
    }
  }, [activeThread, applyThreadUpdate]);

  const clearActiveThread = useCallback(() => {
    setActiveThread(null);
  }, []);

  return {
    threads,
    activeThread,
    isLoading,
    error,
    loadThreads,
    selectThread,
    startThread,
    sendMessage,
    renameActiveThread,
    pinActiveDraft,
    saveActiveDraft,
    restoreActiveDraftVersion,
    clearActiveThread,
  } as const;
}

export const useRewrite = useBrandVoice;
