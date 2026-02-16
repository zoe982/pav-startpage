import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminDashboard } from '../../../src/pages/admin/AdminDashboard.tsx';
import { renderWithProviders, mockAdminUser } from '../../helpers.tsx';

describe('AdminDashboard', () => {
  it('renders dashboard with cards', () => {
    renderWithProviders(<AdminDashboard />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      route: '/admin',
    });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    // "Manage Links" appears in both the sidebar and the dashboard card
    expect(screen.getAllByText('Manage Links')).toHaveLength(2);
    expect(screen.getAllByText('Manage Wiki')).toHaveLength(2);
  });

  it('has links to manage pages', () => {
    renderWithProviders(<AdminDashboard />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      route: '/admin',
    });
    // Find the card (h2) "Manage Links" and check its parent <a>
    const manageLinksHeadings = screen.getAllByText('Manage Links');
    const cardLink = manageLinksHeadings.find((el) => el.tagName === 'H2')!.closest('a');
    expect(cardLink).toHaveAttribute('href', '/admin/links');

    const manageWikiHeadings = screen.getAllByText('Manage Wiki');
    const wikiCard = manageWikiHeadings.find((el) => el.tagName === 'H2')!.closest('a');
    expect(wikiCard).toHaveAttribute('href', '/admin/wiki');
  });
});
