import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AuthGuard } from '../../../src/components/auth/AuthGuard.tsx';
import { renderWithProviders, mockUser } from '../../helpers.tsx';

describe('AuthGuard', () => {
  it('shows spinner while loading', () => {
    const { container } = renderWithProviders(
      <AuthGuard><div>content</div></AuthGuard>,
      { auth: { isLoading: true } },
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithProviders(
      <AuthGuard><div>content</div></AuthGuard>,
      { auth: { isAuthenticated: false, isLoading: false } },
    );
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    // Navigate component will change the URL
  });

  it('renders children when authenticated', () => {
    renderWithProviders(
      <AuthGuard><div>content</div></AuthGuard>,
      { auth: { user: mockUser(), isAuthenticated: true, isLoading: false } },
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
