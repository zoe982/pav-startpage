import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageWikiPage } from '../../../src/pages/admin/ManageWikiPage.tsx';
import { renderWithProviders, mockAdminUser, mockWikiPageSummary } from '../../helpers.tsx';

vi.mock('../../../src/api/wiki.ts', () => ({
  fetchAdminWikiPages: vi.fn(),
  deleteWikiPage: vi.fn(),
}));

import { fetchAdminWikiPages, deleteWikiPage } from '../../../src/api/wiki.ts';

describe('ManageWikiPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchAdminWikiPages).mockReset();
    vi.mocked(deleteWikiPage).mockReset();
    addToast.mockClear();
  });

  function renderPage() {
    return renderWithProviders(<ManageWikiPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/wiki',
    });
  }

  it('shows loading skeleton', () => {
    vi.mocked(fetchAdminWikiPages).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state', async () => {
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No wiki pages yet. Create one to get started.')).toBeInTheDocument();
    });
  });

  it('renders pages with badges', async () => {
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([
      mockWikiPageSummary({ id: '1', title: 'Draft Page', slug: 'draft', isPublished: false, showOnStart: false }),
      mockWikiPageSummary({ id: '2', title: 'Pinned Page', slug: 'pinned', isPublished: true, showOnStart: true }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Draft Page')).toBeInTheDocument();
    });
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('has New Page link', async () => {
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('New Page')).toBeInTheDocument();
    });
    expect(screen.getByText('New Page').closest('a')).toHaveAttribute('href', '/admin/wiki/new');
  });

  it('deletes page with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([
      mockWikiPageSummary({ id: '1', title: 'Delete Me', slug: 'delete-me' }),
    ]);
    vi.mocked(deleteWikiPage).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    vi.mocked(fetchAdminWikiPages).mockResolvedValue([]);
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(deleteWikiPage).toHaveBeenCalledWith('delete-me');
    });
    expect(addToast).toHaveBeenCalledWith('Page deleted', 'success');
  });

  it('does not delete when confirmation cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([mockWikiPageSummary()]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Delete'));
    expect(deleteWikiPage).not.toHaveBeenCalled();
  });

  it('shows error toast on load failure', async () => {
    vi.mocked(fetchAdminWikiPages).mockRejectedValue(new Error('fail'));
    renderPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to load wiki pages', 'error');
    });
  });

  it('shows error toast on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([mockWikiPageSummary({ slug: 'test' })]);
    vi.mocked(deleteWikiPage).mockRejectedValue(new Error('fail'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to delete page', 'error');
    });
  });

  it('shows edit link for each page', async () => {
    vi.mocked(fetchAdminWikiPages).mockResolvedValue([
      mockWikiPageSummary({ slug: 'my-page', title: 'My Page' }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('My Page')).toBeInTheDocument();
    });

    // The "Edit" link inside the list (not sidebar)
    const editLinks = screen.getAllByText('Edit');
    const pageEdit = editLinks.find((el) => el.closest('a')?.getAttribute('href') === '/admin/wiki/my-page/edit');
    expect(pageEdit).toBeDefined();
  });
});
