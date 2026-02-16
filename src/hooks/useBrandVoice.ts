import { useCallback, useState } from 'react';
import type { BrandMode, OutputStyle, RewriteResult } from '../types/brandVoice.ts';
import { rewriteText } from '../api/brandVoice.ts';

interface UseRewriteReturn {
  readonly result: RewriteResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly rewrite: (text: string, style: OutputStyle, mode: BrandMode) => Promise<void>;
  readonly reset: () => void;
}

export function useRewrite(): UseRewriteReturn {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rewrite = useCallback(async (text: string, style: OutputStyle, mode: BrandMode) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await rewriteText(text, style, mode);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rewrite text');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, rewrite, reset } as const;
}
