import { useCallback, useRef, useState } from 'react';
import type { BrandMode, OutputStyle, RewriteResult } from '../types/brandVoice.ts';
import { rewriteText } from '../api/brandVoice.ts';

interface UseRewriteReturn {
  readonly result: RewriteResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly rewrite: (text: string, style: OutputStyle, mode: BrandMode) => Promise<void>;
  readonly cancel: () => void;
  readonly reset: () => void;
}

export function useRewrite(): UseRewriteReturn {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsLoading(false);
  }, []);

  const rewrite = useCallback(async (text: string, style: OutputStyle, mode: BrandMode) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);
      const data = await rewriteText(text, style, mode, controller.signal);
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to rewrite text');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, rewrite, cancel, reset } as const;
}
