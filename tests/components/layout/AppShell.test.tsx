import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AppShell } from '../../../src/components/layout/AppShell.tsx';
import { renderWithProviders, mockUser } from '../../helpers.tsx';

describe('AppShell', () => {
  it('renders Header and children', () => {
    renderWithProviders(
      <AppShell>
        <div data-testid="child">Content</div>
      </AppShell>,
      { auth: { user: mockUser(), isAuthenticated: true } },
    );

    expect(screen.getByText('Pet Air Valet')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Content');
  });
});
