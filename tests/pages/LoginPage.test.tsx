import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LoginPage } from '../../src/pages/LoginPage.tsx';
import { renderWithProviders, mockUser } from '../helpers.tsx';

describe('LoginPage', () => {
  it('shows spinner while loading', () => {
    const { container } = renderWithProviders(<LoginPage />, {
      auth: { isLoading: true },
    });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to / when authenticated', () => {
    renderWithProviders(<LoginPage />, {
      auth: { user: mockUser(), isAuthenticated: true, isLoading: false },
    });
    expect(screen.queryByAltText('Pet Air Valet')).not.toBeInTheDocument();
  });

  it('renders login form when not authenticated', () => {
    renderWithProviders(<LoginPage />, {
      auth: { isAuthenticated: false, isLoading: false },
    });
    expect(screen.getByAltText('Pet Air Valet')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with your PetAirValet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in with google/i })).toBeInTheDocument();
  });
});
