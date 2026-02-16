import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NotFoundPage } from '../../src/pages/NotFoundPage.tsx';
import { renderWithProviders, mockUser } from '../helpers.tsx';

describe('NotFoundPage', () => {
  it('renders 404 page with home link', () => {
    renderWithProviders(<NotFoundPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    const homeLink = screen.getByText('Go home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });
});
