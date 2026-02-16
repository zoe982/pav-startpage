import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { EditWikiPage } from '../../../src/pages/admin/EditWikiPage.tsx';
import { renderWithProviders, mockAdminUser, mockWikiPage } from '../../helpers.tsx';

vi.mock('../../../src/api/wiki.ts', () => ({
  fetchAdminWikiPage: vi.fn(),
  createWikiPage: vi.fn(),
  updateWikiPage: vi.fn(),
}));

vi.mock('../../../src/components/wiki/MarkdownEditor.tsx', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="md-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import { fetchAdminWikiPage, createWikiPage, updateWikiPage } from '../../../src/api/wiki.ts';

describe('EditWikiPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchAdminWikiPage).mockReset();
    vi.mocked(createWikiPage).mockReset();
    vi.mocked(updateWikiPage).mockReset();
    addToast.mockClear();
  });

  function renderNewPage() {
    return renderWithProviders(
      <Routes>
        <Route path="/admin/wiki/new" element={<EditWikiPage />} />
        <Route path="/admin/wiki" element={<div>wiki list</div>} />
      </Routes>,
      {
        auth: { user: mockAdminUser(), isAuthenticated: true },
        toast: { addToast },
        route: '/admin/wiki/new',
      },
    );
  }

  function renderEditPage(slug = 'test-page') {
    return renderWithProviders(
      <Routes>
        <Route path="/admin/wiki/:slug/edit" element={<EditWikiPage />} />
        <Route path="/admin/wiki" element={<div>wiki list</div>} />
      </Routes>,
      {
        auth: { user: mockAdminUser(), isAuthenticated: true },
        toast: { addToast },
        route: `/admin/wiki/${slug}/edit`,
      },
    );
  }

  it('renders new page form', () => {
    renderNewPage();
    expect(screen.getByText('New Page')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Slug')).toHaveValue('');
  });

  it('auto-generates slug from title in new mode', async () => {
    renderNewPage();

    await userEvent.type(screen.getByLabelText('Title'), 'My New Page');

    expect(screen.getByLabelText('Slug')).toHaveValue('my-new-page');
  });

  it('stops auto-slug when slug is manually edited', async () => {
    renderNewPage();

    await userEvent.type(screen.getByLabelText('Title'), 'Initial');
    expect(screen.getByLabelText('Slug')).toHaveValue('initial');

    // Manually edit slug
    await userEvent.clear(screen.getByLabelText('Slug'));
    await userEvent.type(screen.getByLabelText('Slug'), 'custom-slug');

    // Now change title again - slug should not auto-update
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Different');

    expect(screen.getByLabelText('Slug')).toHaveValue('custom-slug');
  });

  it('creates page on submit in new mode', async () => {
    vi.mocked(createWikiPage).mockResolvedValue(mockWikiPage());
    renderNewPage();

    await userEvent.type(screen.getByLabelText('Title'), 'Test');
    await userEvent.type(screen.getByLabelText('Slug'), 'test');

    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(createWikiPage).toHaveBeenCalled();
    });
    expect(addToast).toHaveBeenCalledWith('Page created', 'success');
  });

  it('shows loading state in edit mode', () => {
    vi.mocked(fetchAdminWikiPage).mockReturnValue(new Promise(() => {}));
    const { container } = renderEditPage();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('loads and displays page data in edit mode', async () => {
    const page = mockWikiPage({
      title: 'Existing Page',
      slug: 'test-page',
      content: '# Hello',
      isPublished: true,
      showOnStart: true,
      sortOrder: 5,
    });
    vi.mocked(fetchAdminWikiPage).mockResolvedValue(page);
    renderEditPage();

    await waitFor(() => {
      expect(screen.getByText('Edit Page')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Title')).toHaveValue('Existing Page');
    expect(screen.getByLabelText('Slug')).toHaveValue('test-page');
  });

  it('updates page on submit in edit mode', async () => {
    const page = mockWikiPage({ slug: 'test-page' });
    vi.mocked(fetchAdminWikiPage).mockResolvedValue(page);
    vi.mocked(updateWikiPage).mockResolvedValue(page);
    renderEditPage();

    await waitFor(() => {
      expect(screen.getByText('Edit Page')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateWikiPage).toHaveBeenCalledWith('test-page', expect.any(Object));
    });
    expect(addToast).toHaveBeenCalledWith('Page updated', 'success');
  });

  it('shows error toast on save failure', async () => {
    vi.mocked(createWikiPage).mockRejectedValue(new Error('fail'));
    renderNewPage();

    await userEvent.type(screen.getByLabelText('Title'), 'Test');
    await userEvent.type(screen.getByLabelText('Slug'), 'test');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to save page', 'error');
    });
  });

  it('shows error toast on load failure', async () => {
    vi.mocked(fetchAdminWikiPage).mockRejectedValue(new Error('fail'));
    renderEditPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to load page', 'error');
    });
  });

  it('shows Saving... while submitting', async () => {
    vi.mocked(createWikiPage).mockReturnValue(new Promise(() => {}));
    renderNewPage();

    await userEvent.type(screen.getByLabelText('Title'), 'Test');
    await userEvent.type(screen.getByLabelText('Slug'), 'test');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('toggles isPublished checkbox', async () => {
    renderNewPage();
    const checkbox = screen.getByLabelText('Published');
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('toggles showOnStart checkbox', async () => {
    renderNewPage();
    const checkbox = screen.getByLabelText('Pin to start page');
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('changes sort order', async () => {
    renderNewPage();
    const input = screen.getByLabelText('Sort order');
    expect(input).toHaveValue(0);

    await userEvent.clear(input);
    await userEvent.type(input, '10');
    expect(input).toHaveValue(10);
  });

  it('updates content via markdown editor', async () => {
    renderNewPage();
    const editor = screen.getByTestId('md-editor');
    await userEvent.type(editor, '# New Content');
    expect(editor).toHaveValue('# New Content');
  });

  it('navigates to /admin/wiki on cancel', async () => {
    renderNewPage();
    await userEvent.click(screen.getByText('Cancel'));
    // After clicking Cancel, it navigates to /admin/wiki
    await waitFor(() => {
      expect(screen.getByText('wiki list')).toBeInTheDocument();
    });
  });
});
