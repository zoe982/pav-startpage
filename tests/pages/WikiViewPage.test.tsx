import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { WikiViewPage } from '../../src/pages/WikiViewPage.tsx';
import { renderWithProviders, mockUser, mockWikiPage, mockWikiPageSummary } from '../helpers.tsx';

vi.mock('../../src/hooks/useWiki.ts', () => ({
  useWikiPages: vi.fn(),
  useWikiPage: vi.fn(),
}));

import { useWikiPages, useWikiPage } from '../../src/hooks/useWiki.ts';

// We render within a route to have :slug param available
function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/wiki/:slug" element={<WikiViewPage />} />
    </Routes>,
    {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/wiki/test-page',
    },
  );
}

function renderPageWithoutSlug() {
  return renderWithProviders(
    <Routes>
      <Route path="/wiki" element={<WikiViewPage />} />
    </Routes>,
    {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/wiki',
    },
  );
}

describe('WikiViewPage', () => {
  beforeEach(() => {
    vi.mocked(useWikiPages).mockReset();
    vi.mocked(useWikiPage).mockReset();
    vi.mocked(useWikiPages).mockReturnValue({
      pages: [mockWikiPageSummary()],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it('shows loading skeleton while loading', () => {
    vi.mocked(useWikiPage).mockReturnValue({
      page: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderPage();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows error message', () => {
    vi.mocked(useWikiPage).mockReturnValue({
      page: null,
      isLoading: false,
      error: 'Page not found',
      refresh: vi.fn(),
    });

    renderPage();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders page content when loaded', () => {
    vi.mocked(useWikiPage).mockReturnValue({
      page: mockWikiPage({ title: 'My Page', content: '**Hello**' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    expect(screen.getByText('My Page')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows back link to wiki list', () => {
    vi.mocked(useWikiPage).mockReturnValue({
      page: mockWikiPage(),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    const backLink = screen.getByText(/All pages/);
    expect(backLink.closest('a')).toHaveAttribute('href', '/wiki');
  });

  it('handles missing slug param by using empty string', () => {
    vi.mocked(useWikiPage).mockReturnValue({
      page: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPageWithoutSlug();
    // useWikiPage should be called with empty string (slug ?? '')
    expect(useWikiPage).toHaveBeenCalledWith('');
  });
});
