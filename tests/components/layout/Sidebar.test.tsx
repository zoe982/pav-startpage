import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Sidebar } from '../../../src/components/layout/Sidebar.tsx';
import { renderWithProviders, mockAdminUser } from '../../helpers.tsx';

describe('Sidebar', () => {
  it('renders all admin links', () => {
    renderWithProviders(<Sidebar />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Links')).toBeInTheDocument();
    expect(screen.getByText('Manage Wiki')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    renderWithProviders(<Sidebar />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      route: '/admin',
    });
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.className).toContain('bg-pav-gold');
  });

  it('does not highlight inactive routes', () => {
    renderWithProviders(<Sidebar />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      route: '/admin',
    });
    const linksLink = screen.getByText('Manage Links');
    expect(linksLink.className).not.toContain('bg-pav-gold');
  });
});
