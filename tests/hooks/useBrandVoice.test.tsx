import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRewrite } from '../../src/hooks/useBrandVoice.ts';

vi.mock('../../src/api/brandVoice.ts', () => ({
  rewriteText: vi.fn(),
}));

import { rewriteText } from '../../src/api/brandVoice.ts';

describe('useRewrite', () => {
  beforeEach(() => {
    vi.mocked(rewriteText).mockReset();
  });

  it('starts with null result and no loading', () => {
    const { result } = renderHook(() => useRewrite());
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rewrites text and sets result', async () => {
    const rewriteResult = { original: 'Hi', rewritten: 'Hello' };
    vi.mocked(rewriteText).mockResolvedValue(rewriteResult);

    const { result } = renderHook(() => useRewrite());

    await act(async () => {
      await result.current.rewrite('Hi', 'email', 'rewrite');
    });

    expect(result.current.result).toEqual(rewriteResult);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    vi.mocked(rewriteText).mockRejectedValue(new Error('Network fail'));

    const { result } = renderHook(() => useRewrite());

    await act(async () => {
      await result.current.rewrite('Hi', 'email', 'rewrite');
    });

    expect(result.current.error).toBe('Network fail');
    expect(result.current.result).toBeNull();
  });

  it('sets fallback error for non-Error throws', async () => {
    vi.mocked(rewriteText).mockRejectedValue('string error');

    const { result } = renderHook(() => useRewrite());

    await act(async () => {
      await result.current.rewrite('Hi', 'email', 'rewrite');
    });

    expect(result.current.error).toBe('Failed to rewrite text');
  });

  it('reset clears result and error', async () => {
    const rewriteResult = { original: 'Hi', rewritten: 'Hello' };
    vi.mocked(rewriteText).mockResolvedValue(rewriteResult);

    const { result } = renderHook(() => useRewrite());

    await act(async () => {
      await result.current.rewrite('Hi', 'email', 'rewrite');
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
