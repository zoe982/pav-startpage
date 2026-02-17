import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppAccess } from '../../src/hooks/useAppAccess.ts';

vi.mock('../../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../src/hooks/useAuth.ts';

describe('useAppAccess', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it('returns no access when user is missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { result } = renderHook(() => useAppAccess());

    expect(result.current.isInternal).toBe(false);
    expect(result.current.hasAccess('wiki')).toBe(false);
  });

  it('grants all app access for internal users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@petairvalet.com',
        name: 'Internal User',
        pictureUrl: null,
        isAdmin: false,
        isInternal: true,
        appGrants: [],
      },
      isLoading: false,
      isAuthenticated: true,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { result } = renderHook(() => useAppAccess());

    expect(result.current.isInternal).toBe(true);
    expect(result.current.hasAccess('brand-voice')).toBe(true);
    expect(result.current.hasAccess('templates')).toBe(true);
    expect(result.current.hasAccess('wiki')).toBe(true);
  });

  it('grants only explicitly listed apps for external users', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-2',
        email: 'external@example.com',
        name: 'External User',
        pictureUrl: null,
        isAdmin: false,
        isInternal: false,
        appGrants: ['wiki'],
      },
      isLoading: false,
      isAuthenticated: true,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { result } = renderHook(() => useAppAccess());

    expect(result.current.isInternal).toBe(false);
    expect(result.current.hasAccess('wiki')).toBe(true);
    expect(result.current.hasAccess('brand-voice')).toBe(false);
  });
});
