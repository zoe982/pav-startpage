import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTemplate, useTemplates } from '../../src/hooks/useTemplates.ts';

vi.mock('../../src/api/templates.ts', () => ({
  fetchTemplates: vi.fn(),
  fetchTemplate: vi.fn(),
}));

import { fetchTemplates, fetchTemplate } from '../../src/api/templates.ts';

describe('useTemplates', () => {
  beforeEach(() => {
    vi.mocked(fetchTemplates).mockReset();
    vi.mocked(fetchTemplate).mockReset();
  });

  it('loads templates on mount with type filter', async () => {
    const templates = [
      {
        id: 'template-1',
        title: 'Welcome',
        type: 'email',
        subject: 'Welcome',
        content: 'Hi there',
        createdBy: 'u1',
        createdByName: 'User',
        updatedBy: 'u1',
        updatedByName: 'User',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ] as const;
    vi.mocked(fetchTemplates).mockResolvedValue(templates);

    const { result } = renderHook(() => useTemplates('email'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchTemplates).toHaveBeenCalledWith('email');
    expect(result.current.templates).toEqual(templates);
    expect(result.current.error).toBeNull();
  });

  it('sets fallback error when fetching templates throws non-Error', async () => {
    vi.mocked(fetchTemplates).mockRejectedValue('boom');

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load templates');
    expect(result.current.templates).toEqual([]);
  });

  it('keeps thrown Error message when fetching templates fails', async () => {
    vi.mocked(fetchTemplates).mockRejectedValue(new Error('Templates request failed'));

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Templates request failed');
  });

  it('refresh reloads templates', async () => {
    vi.mocked(fetchTemplates)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'template-2',
          title: 'Second',
          type: 'whatsapp',
          subject: null,
          content: 'Hi there',
          createdBy: 'u1',
          createdByName: 'User',
          updatedBy: 'u1',
          updatedByName: 'User',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

    const { result } = renderHook(() => useTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0]?.id).toBe('template-2');
  });
});

describe('useTemplate', () => {
  beforeEach(() => {
    vi.mocked(fetchTemplate).mockReset();
  });

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useTemplate(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.template).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchTemplate).not.toHaveBeenCalled();
  });

  it('loads template by id', async () => {
    const template = {
      id: 'template-1',
      title: 'Welcome',
      type: 'email',
      subject: 'Welcome',
      content: 'Hi',
      createdBy: 'u1',
      createdByName: 'User',
      updatedBy: 'u1',
      updatedByName: 'User',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as const;

    vi.mocked(fetchTemplate).mockResolvedValue(template);
    const { result } = renderHook(() => useTemplate('template-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchTemplate).toHaveBeenCalledWith('template-1');
    expect(result.current.template).toEqual(template);
    expect(result.current.error).toBeNull();
  });

  it('sets Error message when fetching template fails', async () => {
    vi.mocked(fetchTemplate).mockRejectedValue(new Error('Template failed'));
    const { result } = renderHook(() => useTemplate('template-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Template failed');
    expect(result.current.template).toBeNull();
  });

  it('uses fallback message when fetching template throws non-Error', async () => {
    vi.mocked(fetchTemplate).mockRejectedValue('boom');
    const { result } = renderHook(() => useTemplate('template-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load template');
    expect(result.current.template).toBeNull();
  });
});
