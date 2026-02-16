import { useCallback, useEffect, useState } from 'react';
import type { Template } from '../types/template.ts';
import { fetchTemplates, fetchTemplate } from '../api/templates.ts';

interface UseTemplatesReturn {
  readonly templates: Template[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

export function useTemplates(type?: string): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTemplates(type);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { templates, isLoading, error, refresh } as const;
}

interface UseTemplateReturn {
  readonly template: Template | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

export function useTemplate(id: string | undefined): UseTemplateReturn {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTemplate(id);
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { template, isLoading, error, refresh } as const;
}
