import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('does not fetch wiki pages when wiki access is not granted', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser({ isInternal: false, appGrants: [] }), isAuthenticated: true },
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search apps...')).toBeInTheDocument();
    });
    expect(fetchWikiPages).not.toHaveBeenCalled();
  });

  it('filters results by search and clears search via clear button', async () => {
    const user = userEvent.setup();
    vi.mocked(useLinks).mockReturnValue({
      links: [
        mockLink({ id: '1', title: 'Atlas', description: 'Flight docs' }),
        mockLink({ id: '2', title: 'Ops Board', description: 'Team dashboard' }),
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const input = screen.getByPlaceholderText('Search apps...');
    await user.type(input, 'brand');
    expect(screen.getByText('Results for "brand"')).toBeInTheDocument();
    expect(screen.getByText('Brand Voice')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('shows no-results message when search matches nothing', async () => {
    const user = userEvent.setup();
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: 'Flight docs' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByPlaceholderText('Search apps...'), 'zzz-not-found');
    expect(screen.getByText('No apps matching “zzz-not-found”')).toBeInTheDocument();
  });

  it('supports keyboard shortcuts for focus and escape clear', async () => {
    const user = userEvent.setup();
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const input = screen.getByPlaceholderText('Search apps...');
    input.blur();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(input).toHaveFocus();

    await user.type(input, 'atlas');
    expect(input).toHaveValue('atlas');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(input).toHaveValue('');
  });

  it('shows quick-links search heading when only links match', async () => {
    const user = userEvent.setup();
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: 'Flight docs' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByPlaceholderText('Search apps...'), 'flight');
    expect(screen.getByText('Results for "flight"')).toBeInTheDocument();
  });

  it('hides quick links section for non-internal users', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Internal Link' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: {
        user: mockUser({ isInternal: false, appGrants: [{ appKey: 'wiki' }] }),
        isAuthenticated: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search apps...')).toBeInTheDocument();
    });
    expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal Link')).not.toBeInTheDocument();
  });

  it('handles links with null descriptions when filtering', async () => {
    const user = userEvent.setup();
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: null })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByPlaceholderText('Search apps...'), 'zzz-no-match');
    expect(screen.getByText('No apps matching “zzz-no-match”')).toBeInTheDocument();
  });
});
