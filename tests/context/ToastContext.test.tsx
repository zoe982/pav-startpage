import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, ToastContext } from '../../src/context/ToastContext.tsx';
import { useContext } from 'react';

function TestConsumer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="count">{ctx.toasts.length}</span>
      <ul>
        {ctx.toasts.map((t) => (
          <li key={t.id} data-testid={`toast-${t.id}`}>
            {t.message} ({t.type})
            <button onClick={() => ctx.removeToast(t.id)}>remove</button>
          </li>
        ))}
      </ul>
      <button onClick={() => ctx.addToast('Hello', 'success')}>add-success</button>
      <button onClick={() => ctx.addToast('Error msg', 'error')}>add-error</button>
      <button onClick={() => ctx.addToast('Info msg', 'info')}>add-info</button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('uuid-1' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('uuid-2' as ReturnType<typeof crypto.randomUUID>)
      .mockReturnValueOnce('uuid-3' as ReturnType<typeof crypto.randomUUID>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with no toasts', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('adds a toast', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('add-success').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it('removes a toast manually', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('add-success').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    act(() => {
      screen.getByText('remove').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('auto-dismisses after 5 seconds', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('add-success').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('supports multiple toasts of different types', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText('add-success').click();
      screen.getByText('add-error').click();
      screen.getByText('add-info').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/Error msg/)).toBeInTheDocument();
    expect(screen.getByText(/Info msg/)).toBeInTheDocument();
  });
});
