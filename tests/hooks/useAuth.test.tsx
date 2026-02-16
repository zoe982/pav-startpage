import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth.ts';
import { AuthContext } from '../../src/context/AuthContext.tsx';
import type { AuthContextValue } from '../../src/context/AuthContext.tsx';
import type { ReactNode } from 'react';

describe('useAuth', () => {
  it('returns auth context value when inside provider', () => {
    const value: AuthContextValue = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
