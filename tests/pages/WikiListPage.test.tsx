import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { WikiListPage } from '../../src/pages/WikiListPage.tsx';
import { renderWithProviders, mockUser, mockWikiPageSummary } from '../helpers.tsx';

vi.mock('../../src/hooks/useWiki.ts', () => ({
  useWikiPages: vi.fn(),
  useWikiPage: vi.fn(),
}));

import { useWikiPages } from '../../src/hooks/useWiki.ts';

describe('WikiListPage', () => {
  beforeEach(() => {
    vi.mocked(useWikiPages).mockReset();
  });

  it('shows loading skeletons while loading', () => {
    vi.mocked(useWikiPages).mockReturnValue({
      pages: [],
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderWithProviders(<WikiListPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });

  it('shows error message', () => {
    vi.mocked(useWikiPages).mockReturnValue({
      pages: [],
      isLoading: false,
      error: 'Failed to load',
      refresh: vi.fn(),
    });

    renderWithProviders(<WikiListPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders wiki pages when loaded', () => {
    vi.mocked(useWikiPages).mockReturnValue({
      pages: [
        mockWikiPageSummary({ id: '1', slug: 'page-1', title: 'Page 1' }),
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<WikiListPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByRole('heading', { name: 'Wiki' })).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });
});
