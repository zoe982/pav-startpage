import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRewrite } from '../../src/hooks/useBrandVoice.ts';

vi.mock('../../src/api/brandVoice.ts', () => ({
  rewriteText: vi.fn(),
  refineText: vi.fn(),
}));

import { rewriteText, refineText } from '../../src/api/brandVoice.ts';

describe('useRewrite', () => {
  beforeEach(() => {
    vi.mocked(rewriteText).mockReset();
    vi.mocked(refineText).mockReset();
  });

  it('starts with null result and no loading', () => {
    const { result } = renderHook(() => useRewrite());
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.feedbackHistory).toEqual([]);
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

  it('passes customStyleDescription to rewriteText', async () => {
    vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });

    const { result } = renderHook(() => useRewrite());

    await act(async () => {
      await result.current.rewrite('Hi', 'other', 'rewrite', 'Instagram caption');
    });

    expect(vi.mocked(rewriteText)).toHaveBeenCalledWith(
      'Hi', 'other', 'rewrite', expect.any(AbortSignal), 'Instagram caption',
    );
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

  it('reset clears result, error, and feedbackHistory', async () => {
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
    expect(result.current.feedbackHistory).toEqual([]);
  });

  it('cancel aborts in-flight request and clears loading', async () => {
    vi.mocked(rewriteText).mockImplementation(
      () => new Promise((_resolve, reject) => { /* never resolves */ }),
    );

    const { result } = renderHook(() => useRewrite());

    // Start a rewrite (don't await — it will hang until resolved/rejected)
    act(() => {
      void result.current.rewrite('Hi', 'email', 'rewrite');
    });

    expect(result.current.isLoading).toBe(true);

    // Cancel mid-flight
    act(() => {
      result.current.cancel();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify signal was passed to rewriteText
    expect(vi.mocked(rewriteText)).toHaveBeenCalledWith(
      'Hi', 'email', 'rewrite', expect.any(AbortSignal), undefined,
    );
  });

  it('exposes cancel function', () => {
    const { result } = renderHook(() => useRewrite());
    expect(typeof result.current.cancel).toBe('function');
  });

  describe('refine', () => {
    it('does nothing when there is no result', async () => {
      const { result } = renderHook(() => useRewrite());

      await act(async () => {
        await result.current.refine('Make it shorter', 'email', 'rewrite');
      });

      expect(vi.mocked(refineText)).not.toHaveBeenCalled();
    });

    it('calls refineText and updates result and feedbackHistory', async () => {
      vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
      vi.mocked(refineText).mockResolvedValue({ original: 'Hi', rewritten: 'Hey there' });

      const { result } = renderHook(() => useRewrite());

      // First, get a result
      await act(async () => {
        await result.current.rewrite('Hi', 'email', 'rewrite');
      });

      expect(result.current.feedbackHistory).toEqual([]);

      // Now refine
      await act(async () => {
        await result.current.refine('Make it casual', 'email', 'rewrite');
      });

      expect(result.current.result).toEqual({ original: 'Hi', rewritten: 'Hey there' });
      expect(result.current.feedbackHistory).toEqual(['Make it casual']);
    });

    it('accumulates multiple refinement feedback entries', async () => {
      vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
      vi.mocked(refineText)
        .mockResolvedValueOnce({ original: 'Hi', rewritten: 'Hey' })
        .mockResolvedValueOnce({ original: 'Hi', rewritten: 'Hey!' });

      const { result } = renderHook(() => useRewrite());

      await act(async () => {
        await result.current.rewrite('Hi', 'email', 'rewrite');
      });

      await act(async () => {
        await result.current.refine('Shorter', 'email', 'rewrite');
      });

      await act(async () => {
        await result.current.refine('Add excitement', 'email', 'rewrite');
      });

      expect(result.current.feedbackHistory).toEqual(['Shorter', 'Add excitement']);
    });

    it('passes customStyleDescription through refine', async () => {
      vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
      vi.mocked(refineText).mockResolvedValue({ original: 'Hi', rewritten: 'Hey' });

      const { result } = renderHook(() => useRewrite());

      await act(async () => {
        await result.current.rewrite('Hi', 'other', 'rewrite', 'Slack message');
      });

      await act(async () => {
        await result.current.refine('Shorter', 'other', 'rewrite', 'Slack message');
      });

      expect(vi.mocked(refineText)).toHaveBeenCalledWith(
        expect.objectContaining({
          customStyleDescription: 'Slack message',
          feedback: 'Shorter',
        }),
        expect.any(AbortSignal),
      );
    });

    it('rewrite clears feedbackHistory from previous session', async () => {
      vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
      vi.mocked(refineText).mockResolvedValue({ original: 'Hi', rewritten: 'Hey' });

      const { result } = renderHook(() => useRewrite());

      await act(async () => {
        await result.current.rewrite('Hi', 'email', 'rewrite');
      });

      await act(async () => {
        await result.current.refine('Shorter', 'email', 'rewrite');
      });

      expect(result.current.feedbackHistory).toEqual(['Shorter']);

      // New rewrite should clear history
      await act(async () => {
        await result.current.rewrite('Bye', 'email', 'rewrite');
      });

      expect(result.current.feedbackHistory).toEqual([]);
    });

    it('sets error on refine failure', async () => {
      vi.mocked(rewriteText).mockResolvedValue({ original: 'Hi', rewritten: 'Hello' });
      vi.mocked(refineText).mockRejectedValue(new Error('Refine failed'));

      const { result } = renderHook(() => useRewrite());

      await act(async () => {
        await result.current.rewrite('Hi', 'email', 'rewrite');
      });

      await act(async () => {
        await result.current.refine('Shorter', 'email', 'rewrite');
      });

      expect(result.current.error).toBe('Refine failed');
    });
  });
});
