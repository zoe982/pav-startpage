import type { JSX } from 'react';
import {
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'info';
}

export interface ToastContextValue {
  readonly toasts: readonly Toast[];
  readonly addToast: (message: string, type: Toast['type']) => void;
  readonly removeToast: (id: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast['type']) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
