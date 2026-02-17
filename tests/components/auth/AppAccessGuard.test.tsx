import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { AppAccessGuard } from '../../../src/components/auth/AppAccessGuard.tsx';
import { renderWithProviders } from '../../helpers.tsx';

vi.mock('../../../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useAppAccess.ts', () => ({
  useAppAccess: vi.fn(),
}));

import { useAuth } from '../../../src/hooks/useAuth.ts';
import { useAppAccess } from '../../../src/hooks/useAppAccess.ts';

describe('AppAccessGuard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
    vi.mocked(useAppAccess).mockReset();
    vi.mocked(useAppAccess).mockReturnValue({
      isInternal: false,
      hasAccess: vi.fn(() => false),
    });
  });

  it('shows loading spinner while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { container } = renderWithProviders(
      <AppAccessGuard appKey="wiki"><div>protected</div></AppAccessGuard>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('shows auth error message when unauthenticated with authError', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authError: 'Session expired',
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(
      <AppAccessGuard appKey="wiki"><div>protected</div></AppAccessGuard>,
    );

    expect(screen.getByText('Session expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/login');
  });

  it('hides protected children when unauthenticated without authError', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithProviders(
      <AppAccessGuard appKey="wiki"><div>protected</div></AppAccessGuard>,
    );

    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('hides protected children when app access is denied', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@petairvalet.com',
        name: 'User',
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
    vi.mocked(useAppAccess).mockReturnValue({
      isInternal: false,
      hasAccess: vi.fn(() => false),
    });

    renderWithProviders(
      <AppAccessGuard appKey="templates"><div>protected</div></AppAccessGuard>,
    );

    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated and app access is allowed', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@petairvalet.com',
        name: 'User',
        pictureUrl: null,
        isAdmin: false,
        isInternal: true,
        appGrants: ['wiki'],
      },
      isLoading: false,
      isAuthenticated: true,
      authError: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(useAppAccess).mockReturnValue({
      isInternal: false,
      hasAccess: vi.fn(() => true),
    });

    renderWithProviders(
      <AppAccessGuard appKey="wiki"><div>protected</div></AppAccessGuard>,
    );

    expect(screen.getByText('protected')).toBeInTheDocument();
  });
});
