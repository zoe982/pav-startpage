import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { WikiNav } from '../../../src/components/wiki/WikiNav.tsx';
import { renderWithProviders, mockWikiPageSummary } from '../../helpers.tsx';

describe('WikiNav', () => {
  it('renders "No pages yet." when empty', () => {
    renderWithProviders(<WikiNav pages={[]} />, {
      auth: { isAuthenticated: true },
    });
    expect(screen.getByText('No pages yet.')).toBeInTheDocument();
  });

  it('renders page links', () => {
    const pages = [
      mockWikiPageSummary({ id: '1', slug: 'page-a', title: 'Page A' }),
      mockWikiPageSummary({ id: '2', slug: 'page-b', title: 'Page B' }),
    ];
    renderWithProviders(<WikiNav pages={pages} />, {
      auth: { isAuthenticated: true },
    });
    expect(screen.getByText('Page A')).toBeInTheDocument();
    expect(screen.getByText('Page B')).toBeInTheDocument();
    expect(screen.getByText('Page A').closest('a')).toHaveAttribute('href', '/wiki/page-a');
  });

  it('highlights active page', () => {
    const pages = [
      mockWikiPageSummary({ id: '1', slug: 'active-page', title: 'Active' }),
    ];
    renderWithProviders(<WikiNav pages={pages} />, {
      auth: { isAuthenticated: true },
      route: '/wiki/active-page',
    });
    const link = screen.getByText('Active');
    expect(link.className).toContain('bg-secondary-container');
  });

  it('does not highlight non-active page', () => {
    const pages = [
      mockWikiPageSummary({ id: '1', slug: 'other-page', title: 'Other' }),
    ];
    renderWithProviders(<WikiNav pages={pages} />, {
      auth: { isAuthenticated: true },
      route: '/wiki/different',
    });
    const link = screen.getByText('Other');
    expect(link.className).not.toContain('bg-secondary-container');
  });
});
