import { useCallback, useRef, useState } from 'react';
import type { BrandMode, OutputStyle, RewriteResult } from '../types/brandVoice.ts';
import { rewriteText, refineText } from '../api/brandVoice.ts';

interface UseRewriteReturn {
  readonly result: RewriteResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly feedbackHistory: readonly string[];
  readonly rewrite: (text: string, style: OutputStyle, mode: BrandMode, customStyleDescription?: string) => Promise<void>;
  readonly refine: (feedback: string, style: OutputStyle, mode: BrandMode, customStyleDescription?: string) => Promise<void>;
  readonly cancel: () => void;
  readonly reset: () => void;
}

export function useRewrite(): UseRewriteReturn {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<readonly string[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const originalTextRef = useRef<string>('');

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsLoading(false);
  }, []);

  const rewrite = useCallback(async (text: string, style: OutputStyle, mode: BrandMode, customStyleDescription?: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);
      const data = await rewriteText(text, style, mode, controller.signal, customStyleDescription);
      setResult(data);
      originalTextRef.current = text;
      setFeedbackHistory([]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to rewrite text');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refine = useCallback(async (feedback: string, style: OutputStyle, mode: BrandMode, customStyleDescription?: string) => {
    if (!result) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);
      const refinePayload = {
        original: originalTextRef.current,
        currentRewritten: result.rewritten,
        feedback,
        style,
        mode,
        ...(customStyleDescription ? { customStyleDescription } : {}),
      };
      const data = await refineText(refinePayload, controller.signal);
      setResult(data);
      setFeedbackHistory(prev => [...prev, feedback]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to refine text');
    } finally {
      setIsLoading(false);
    }
  }, [result]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResult(null);
    setError(null);
    setFeedbackHistory([]);
    originalTextRef.current = '';
  }, []);

  return { result, isLoading, error, feedbackHistory, rewrite, refine, cancel, reset } as const;
}
