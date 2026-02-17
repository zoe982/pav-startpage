import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartPage } from '../../src/pages/StartPage.tsx';
import { renderWithProviders, mockUser, mockLink } from '../helpers.tsx';
import { getMaterialTextFieldValue, setMaterialTextFieldValue } from '../utils/materialTextField.ts';

vi.mock('../../src/hooks/useLinks.ts', () => ({
  useLinks: vi.fn(),
}));

vi.mock('../../src/api/wiki.ts', () => ({
  fetchWikiPages: vi.fn(),
}));

import { useLinks } from '../../src/hooks/useLinks.ts';
import { fetchWikiPages } from '../../src/api/wiki.ts';

describe('StartPage', () => {
  function getSearchField(): HTMLElement {
    return screen.getByTestId('start-search-field');
  }

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

    expect(screen.getByTestId('start-search-field')).toHaveAttribute('data-m3-component', 'outlined-text-field');
    expect(screen.getByTestId('internal-app-card-brand-voice')).toHaveAttribute('data-m3-component', 'elevated-card');
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Quick Links').className).toContain('text-on-surface');
    expect(screen.getByText('Team Tools').className).toContain('text-on-surface');
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
    expect(screen.getByText('Pinned Wiki Pages').className).toContain('text-on-surface');
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
      expect(screen.getByTestId('start-search-field')).toBeInTheDocument();
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

    const searchField = getSearchField();
    setMaterialTextFieldValue(searchField, 'brand');
    await waitFor(() => {
      expect(screen.getByText('Results for "brand"')).toBeInTheDocument();
      expect(screen.getByText('Brand Voice')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Clear search'));
    expect(getMaterialTextFieldValue(searchField)).toBe('');
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('shows no-results message when search matches nothing', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: 'Flight docs' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    setMaterialTextFieldValue(getSearchField(), 'zzz-not-found');
    await waitFor(() => {
      expect(screen.getByText('No apps matching “zzz-not-found”')).toBeInTheDocument();
    });
  });

  it('supports keyboard shortcuts for focus and escape clear', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const searchField = getSearchField();
    searchField.blur();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(searchField).toHaveFocus();

    setMaterialTextFieldValue(searchField, 'atlas');
    await waitFor(() => {
      expect(getMaterialTextFieldValue(searchField)).toBe('atlas');
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(getMaterialTextFieldValue(searchField)).toBe('');
    });
  });

  it('clears search when escape is pressed while the text-field shadow input is active', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const searchField = getSearchField();
    setMaterialTextFieldValue(searchField, 'atlas');
    await waitFor(() => {
      expect(getMaterialTextFieldValue(searchField)).toBe('atlas');
    });

    Object.defineProperty(searchField, 'shadowRoot', {
      configurable: true,
      value: { activeElement: document.createElement('input') },
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(getMaterialTextFieldValue(searchField)).toBe('');
    });
  });

  it('shows quick-links search heading when only links match', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: 'Flight docs' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    setMaterialTextFieldValue(getSearchField(), 'flight');
    await waitFor(() => {
      expect(screen.getByText('Results for "flight"')).toBeInTheDocument();
    });
  });

  it('uses quick-links heading when search matches both internal apps and links', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Brand flights', description: 'Brand portal' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    setMaterialTextFieldValue(getSearchField(), 'brand');
    await waitFor(() => {
      expect(screen.getByText('Results for "brand"')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });
  });

  it('keeps quick links heading when search matches internal apps and quick links', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Brand wiki', description: 'Brand operations notes' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    setMaterialTextFieldValue(getSearchField(), 'brand');
    await waitFor(() => {
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });
  });

  it('does not clear search when escape is pressed and search field is not focused', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const searchField = getSearchField();
    setMaterialTextFieldValue(searchField, 'atlas');
    await waitFor(() => {
      expect(getMaterialTextFieldValue(searchField)).toBe('atlas');
    });

    searchField.blur();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getMaterialTextFieldValue(searchField)).toBe('atlas');
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
        user: mockUser({ isInternal: false, appGrants: ['wiki'] }),
        isAuthenticated: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('start-search-field')).toBeInTheDocument();
    });
    expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal Link')).not.toBeInTheDocument();
  });

  it('shows only granted internal apps for non-internal users', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: {
        user: mockUser({ isInternal: false, appGrants: ['templates'] }),
        isAuthenticated: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Shared Templates')).toBeInTheDocument();
    });
    expect(screen.queryByText('Brand Voice')).not.toBeInTheDocument();
  });

  it('handles links with null descriptions when filtering', async () => {
    vi.mocked(useLinks).mockReturnValue({
      links: [mockLink({ id: '1', title: 'Atlas', description: null })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<StartPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    setMaterialTextFieldValue(getSearchField(), 'zzz-no-match');
    await waitFor(() => {
      expect(screen.getByText('No apps matching “zzz-no-match”')).toBeInTheDocument();
    });
  });
});
