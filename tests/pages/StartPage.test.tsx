import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StartPage } from '../../src/pages/StartPage.tsx';
import { renderWithProviders, mockUser, mockLink } from '../helpers.tsx';

vi.mock('../../src/hooks/useLinks.ts', () => ({
  useLinks: vi.fn(),
}));

vi.mock('../../src/api/wiki.ts', () => ({
  fetchWikiPages: vi.fn(),
}));

import { useLinks } from '../../src/hooks/useLinks.ts';
import { fetchWikiPages } from '../../src/api/wiki.ts';

describe('StartPage', () => {
  beforeEach(() => {
    vi.mocked(useLinks).mockReset();
    vi.mocked(fetchWikiPages).mockReset();
    vi.mocked(fetchWikiPages).mockResolvedValue([]);
  });

  it('shows loading skeleton when links are loading', () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(container.querySelectorAll('.skeleton-shimmer')).toHaveLength(4);
  });

  it('renders links when loaded', () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'My Link' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('My Link')).toBeInTheDocument();
  });

  it('renders pinned wiki pages', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(fetchWikiPages).mockResolvedValue([
      { id: '1', slug: 'pinned', title: 'Pinned Page', isPublished: true, showOnStart: true, sortOrder: 0 },
      { id: '2', slug: 'not-pinned', title: 'Other Page', isPublished: true, showOnStart: false, sortOrder: 0 },
    ]);

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await waitFor(() => {
      expect(screen.getByText('Pinned Page')).toBeInTheDocument();
    });
    expect(screen.getByText('Pinned Wiki Pages')).toBeInTheDocument();
    expect(screen.queryByText('Other Page')).not.toBeInTheDocument();
  });

  it('does not show pinned section when no pages pinned', () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.queryByText('Pinned Wiki Pages')).not.toBeInTheDocument();
  });
});
