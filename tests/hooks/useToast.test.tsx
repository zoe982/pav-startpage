import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToast } from '../../src/hooks/useToast.ts';
import { ToastContext } from '../../src/context/ToastContext.tsx';
import type { ToastContextValue } from '../../src/context/ToastContext.tsx';
import type { ReactNode } from 'react';

describe('useToast', () => {
  it('returns toast context value when inside provider', () => {
    const value: ToastContextValue = {
      toasts: [],
      addToast: vi.fn(),
      removeToast: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws when used outside ToastProvider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');
  });
});
