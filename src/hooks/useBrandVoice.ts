import { useCallback, useState } from 'react';
import type {
  BrandMode,
  BrandVoiceThread,
  BrandVoiceThreadSummary,
  OutputStyle,
} from '../types/brandVoice.ts';
import {
  listThreads,
  getThread,
  startThread as startThreadRequest,
  replyInThread as replyInThreadRequest,
  renameThread as renameThreadRequest,
  pinThreadDraft as pinThreadDraftRequest,
} from '../api/brandVoice.ts';

interface UseBrandVoiceReturn {
  readonly threads: readonly BrandVoiceThreadSummary[];
  readonly activeThread: BrandVoiceThread | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadThreads: () => Promise<void>;
  readonly selectThread: (threadId: string) => Promise<void>;
  readonly startThread: (
    text: string,
    style: OutputStyle,
    mode: BrandMode,
    customStyleDescription?: string,
  ) => Promise<void>;
  readonly sendMessage: (
    message: string,
    style?: OutputStyle,
    mode?: BrandMode,
    customStyleDescription?: string,
  ) => Promise<void>;
  readonly renameActiveThread: (title: string) => Promise<void>;
  readonly pinActiveDraft: () => Promise<void>;
  readonly clearActiveThread: () => void;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
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

  const startThread = useCallback(async (
    text: string,
    style: OutputStyle,
    mode: BrandMode,
    customStyleDescription?: string,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await startThreadRequest({
        text,
        style,
        mode,
        ...(customStyleDescription
          ? { customStyleDescription }
          : {}),
      });
      applyThreadUpdate(response.thread);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to start thread'));
    } finally {
      setIsLoading(false);
    }
  }, [applyThreadUpdate]);

  const sendMessage = useCallback(async (
    message: string,
    style?: OutputStyle,
    mode?: BrandMode,
    customStyleDescription?: string,
  ) => {
    if (!activeThread) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await replyInThreadRequest({
        threadId: activeThread.id,
        message,
        ...(style ? { style } : {}),
        ...(mode ? { mode } : {}),
        ...(customStyleDescription
          ? { customStyleDescription }
          : {}),
      });
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
    clearActiveThread,
  } as const;
}

export const useRewrite = useBrandVoice;
