import type { JSX } from 'react';
import { useToast } from '../../hooks/useToast.ts';

const typeStyles = {
  success: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-primary text-on-primary',
} as const;

export function ToastContainer(): JSX.Element | null {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-[var(--shadow-elevation-3)] ${typeStyles[toast.type]}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => { removeToast(toast.id); }}
            className="state-layer touch-target-icon ml-2 rounded-full p-1 opacity-70 motion-standard hover:opacity-100"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
