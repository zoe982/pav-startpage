import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageLinksPage } from '../../../src/pages/admin/ManageLinksPage.tsx';
import { renderWithProviders, mockAdminUser, mockLink } from '../../helpers.tsx';

vi.mock('../../../src/api/links.ts', () => ({
  fetchAdminLinks: vi.fn(),
  createLink: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
}));

import { fetchAdminLinks, createLink, updateLink, deleteLink } from '../../../src/api/links.ts';

describe('ManageLinksPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchAdminLinks).mockReset();
    vi.mocked(createLink).mockReset();
    vi.mocked(updateLink).mockReset();
    vi.mocked(deleteLink).mockReset();
    addToast.mockClear();
  });

  function renderPage() {
    return renderWithProviders(<ManageLinksPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/links',
    });
  }

  it('shows loading skeleton initially', () => {
    vi.mocked(fetchAdminLinks).mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no links', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No links yet. Add one to get started.')).toBeInTheDocument();
    });
  });

  it('renders links list', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([
      mockLink({ id: '1', title: 'Link A', url: 'https://a.com' }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Link A')).toBeInTheDocument();
    });
    expect(screen.getByText('https://a.com')).toBeInTheDocument();
  });

  it('shows Hidden badge for invisible links', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([
      mockLink({ id: '1', title: 'Hidden Link', isVisible: false }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });
  });

  it('opens create form and creates link', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([]);
    vi.mocked(createLink).mockResolvedValue(mockLink());

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Add Link'));
    expect(screen.getByText('New Link')).toBeInTheDocument();

    // Re-mock for the reload after create
    vi.mocked(fetchAdminLinks).mockResolvedValue([mockLink()]);

    await userEvent.type(screen.getByLabelText('Title'), 'New');
    await userEvent.type(screen.getByLabelText('URL'), 'https://new.com');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(createLink).toHaveBeenCalled();
    });
    expect(addToast).toHaveBeenCalledWith('Link created', 'success');
  });

  it('opens edit form and updates link', async () => {
    const link = mockLink({ id: '1', title: 'Edit Me', url: 'https://edit.com' });
    vi.mocked(fetchAdminLinks).mockResolvedValue([link]);
    vi.mocked(updateLink).mockResolvedValue(link);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Edit Me')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Edit Link')).toBeInTheDocument();

    vi.mocked(fetchAdminLinks).mockResolvedValue([link]);
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateLink).toHaveBeenCalled();
    });
    expect(addToast).toHaveBeenCalledWith('Link updated', 'success');
  });

  it('deletes link with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const link = mockLink({ id: '1', title: 'Delete Me' });
    vi.mocked(fetchAdminLinks).mockResolvedValue([link]);
    vi.mocked(deleteLink).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    vi.mocked(fetchAdminLinks).mockResolvedValue([]);
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(deleteLink).toHaveBeenCalledWith('1');
    });
    expect(addToast).toHaveBeenCalledWith('Link deleted', 'success');
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(fetchAdminLinks).mockResolvedValue([mockLink()]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Delete'));
    expect(deleteLink).not.toHaveBeenCalled();
  });

  it('shows error toast on load failure', async () => {
    vi.mocked(fetchAdminLinks).mockRejectedValue(new Error('fail'));
    renderPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to load links', 'error');
    });
  });

  it('shows error toast on create failure', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([]);
    vi.mocked(createLink).mockRejectedValue(new Error('fail'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Add Link'));
    await userEvent.type(screen.getByLabelText('Title'), 'X');
    await userEvent.type(screen.getByLabelText('URL'), 'https://x.com');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to create link', 'error');
    });
  });

  it('shows error toast on update failure', async () => {
    const link = mockLink({ id: '1', title: 'Test' });
    vi.mocked(fetchAdminLinks).mockResolvedValue([link]);
    vi.mocked(updateLink).mockRejectedValue(new Error('fail'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Edit'));
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to update link', 'error');
    });
  });

  it('shows error toast on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(fetchAdminLinks).mockResolvedValue([mockLink()]);
    vi.mocked(deleteLink).mockRejectedValue(new Error('fail'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to delete link', 'error');
    });
  });

  it('cancel button hides form', async () => {
    vi.mocked(fetchAdminLinks).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Add Link'));
    expect(screen.getByText('New Link')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Link')).not.toBeInTheDocument();
  });
});
