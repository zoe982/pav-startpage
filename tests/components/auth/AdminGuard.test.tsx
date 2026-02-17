import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminGuard } from '../../../src/components/auth/AdminGuard.tsx';
import { renderWithProviders, mockUser, mockAdminUser } from '../../helpers.tsx';

describe('AdminGuard', () => {
  it('shows spinner while loading', () => {
    const { container } = renderWithProviders(
      <AdminGuard><div>admin content</div></AdminGuard>,
      { auth: { isLoading: true } },
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithProviders(
      <AdminGuard><div>admin content</div></AdminGuard>,
      { auth: { isAuthenticated: false, isLoading: false } },
    );
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('shows auth error message when not authenticated and auth error exists', () => {
    renderWithProviders(
      <AdminGuard><div>admin content</div></AdminGuard>,
      { auth: { isAuthenticated: false, isLoading: false, authError: 'Session expired' } },
    );

    expect(screen.getByText('Session expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/login');
  });

  it('redirects to / for non-admin users', () => {
    renderWithProviders(
      <AdminGuard><div>admin content</div></AdminGuard>,
      { auth: { user: mockUser(), isAuthenticated: true, isLoading: false } },
    );
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders children for admin users', () => {
    renderWithProviders(
      <AdminGuard><div>admin content</div></AdminGuard>,
      { auth: { user: mockAdminUser(), isAuthenticated: true, isLoading: false } },
    );
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
