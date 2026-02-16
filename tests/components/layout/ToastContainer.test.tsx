import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from '../../../src/components/layout/ToastContainer.tsx';
import { renderWithProviders } from '../../helpers.tsx';
import type { Toast } from '../../../src/context/ToastContext.tsx';

describe('ToastContainer', () => {
  it('returns null when there are no toasts', () => {
    const { container } = renderWithProviders(<ToastContainer />, {
      toast: { toasts: [] },
    });
    expect(container.querySelector('[aria-live]')).not.toBeInTheDocument();
  });

  it('renders success toast', () => {
    const toasts: Toast[] = [{ id: '1', message: 'Saved!', type: 'success' }];
    renderWithProviders(<ToastContainer />, {
      toast: { toasts },
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    const toastEl = screen.getByText('Saved!').closest('div');
    expect(toastEl?.className).toContain('bg-green-600');
  });

  it('renders error toast', () => {
    const toasts: Toast[] = [{ id: '1', message: 'Failed!', type: 'error' }];
    renderWithProviders(<ToastContainer />, {
      toast: { toasts },
    });
    const toastEl = screen.getByText('Failed!').closest('div');
    expect(toastEl?.className).toContain('bg-red-600');
  });

  it('renders info toast', () => {
    const toasts: Toast[] = [{ id: '1', message: 'Info!', type: 'info' }];
    renderWithProviders(<ToastContainer />, {
      toast: { toasts },
    });
    const toastEl = screen.getByText('Info!').closest('div');
    expect(toastEl?.className).toContain('bg-pav-blue');
  });

  it('calls removeToast when dismiss is clicked', async () => {
    const removeToast = vi.fn();
    const toasts: Toast[] = [{ id: '1', message: 'Hello', type: 'success' }];
    renderWithProviders(<ToastContainer />, {
      toast: { toasts, removeToast },
    });

    await userEvent.click(screen.getByLabelText('Dismiss'));
    expect(removeToast).toHaveBeenCalledWith('1');
  });

  it('renders multiple toasts', () => {
    const toasts: Toast[] = [
      { id: '1', message: 'First', type: 'success' },
      { id: '2', message: 'Second', type: 'error' },
    ];
    renderWithProviders(<ToastContainer />, {
      toast: { toasts },
    });
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
