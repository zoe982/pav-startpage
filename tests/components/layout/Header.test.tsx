import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../../src/components/layout/Header.tsx';
import { renderWithProviders, mockUser, mockAdminUser } from '../../helpers.tsx';

describe('Header', () => {
  it('renders logo', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Pet Air Valet')).toBeInTheDocument();
  });

  it('does not show nav links when unauthenticated', () => {
    renderWithProviders(<Header />);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Wiki')).not.toBeInTheDocument();
  });

  it('shows nav links when authenticated', () => {
    renderWithProviders(<Header />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Wiki')).toBeInTheDocument();
  });

  it('shows Admin link for admin users', () => {
    renderWithProviders(<Header />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
    });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('does not show Admin link for non-admin users', () => {
    renderWithProviders(<Header />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('does not show Wiki link when authenticated user lacks wiki access', () => {
    renderWithProviders(<Header />, {
      auth: {
        user: mockUser({ isInternal: false, appGrants: [] }),
        isAuthenticated: true,
      },
    });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Wiki')).not.toBeInTheDocument();
  });

  it('shows user picture when available', () => {
    const user = mockUser({ pictureUrl: 'https://example.com/pic.jpg' });
    renderWithProviders(<Header />, {
      auth: { user, isAuthenticated: true },
    });
    const img = document.querySelector('img[src="https://example.com/pic.jpg"]');
    expect(img).toBeInTheDocument();
  });

  it('falls back to initial avatar when user picture fails to load', () => {
    renderWithProviders(<Header />, {
      auth: {
        user: mockUser({ name: 'Jane', pictureUrl: 'https://example.com/broken.jpg' }),
        isAuthenticated: true,
      },
    });

    const img = document.querySelector('img[src="https://example.com/broken.jpg"]');
    expect(img).toBeInTheDocument();
    if (!img) throw new Error('Expected avatar image');

    fireEvent.error(img);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('does not show user picture when null', () => {
    renderWithProviders(<Header />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });
    expect(document.querySelector('img.rounded-full')).not.toBeInTheDocument();
  });

  it('shows user name', () => {
    renderWithProviders(<Header />, {
      auth: { user: mockUser({ name: 'Jane' }), isAuthenticated: true },
    });
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('calls logout on Sign out click', async () => {
    const logoutFn = vi.fn();
    renderWithProviders(<Header />, {
      auth: { user: mockUser(), isAuthenticated: true, logout: logoutFn },
    });

    await userEvent.click(screen.getByText('Sign out'));
    expect(logoutFn).toHaveBeenCalled();
  });

  it('shows offline banner and triggers retry click handler', async () => {
    const onLineDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });

    try {
      const user = userEvent.setup();
      renderWithProviders(<Header />, {
        auth: { user: mockUser(), isAuthenticated: true },
      });

      expect(screen.getByText('Offline. Some actions require a connection.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Retry' }));
    } finally {
      if (onLineDescriptor) {
        Object.defineProperty(window.navigator, 'onLine', onLineDescriptor);
      }
    }
  });
});
