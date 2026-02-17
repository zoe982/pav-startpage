import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus.ts';

const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const onLineDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

function setNavigatorOnlineValue(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setNavigatorOnlineValue(true);
  });

  afterEach(() => {
    if (onLineDescriptor) {
      Object.defineProperty(window.navigator, 'onLine', onLineDescriptor);
    }
    if (navigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
    }
  });

  it('uses navigator.onLine as initial state when navigator exists', () => {
    setNavigatorOnlineValue(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('updates state when browser online/offline events fire', () => {
    setNavigatorOnlineValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    setNavigatorOnlineValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    setNavigatorOnlineValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('defaults to true when navigator is unavailable', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: undefined,
    });

    const imported = await import('../../src/hooks/useOnlineStatus.ts');
    const { result } = renderHook(() => imported.useOnlineStatus());

    expect(result.current).toBe(true);
  });
});
