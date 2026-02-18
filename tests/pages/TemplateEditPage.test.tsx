import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders, mockUser } from '../helpers.tsx';
import { TemplateEditPage } from '../../src/pages/TemplateEditPage.tsx';
import type { Template } from '../../src/types/template.ts';

vi.mock('../../src/hooks/useTemplates.ts', () => ({
  useTemplate: vi.fn(),
}));

vi.mock('../../src/hooks/useToast.ts', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../src/api/templates.ts', () => ({
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}));

vi.mock('../../src/components/templates/VersionHistoryModal.tsx', () => ({
  VersionHistoryModal: ({
    onClose,
    onRestore,
  }: {
    readonly onClose: () => void;
    readonly onRestore: (version: {
      readonly id: string;
      readonly versionNumber: number;
      readonly title: string;
      readonly type: 'email' | 'whatsapp';
      readonly subject: string | null;
      readonly content: string;
      readonly changedByName: string;
      readonly createdAt: string;
    }) => void;
  }) => (
    <div data-testid="version-history-modal">
      <button type="button" onClick={onClose}>Close History</button>
      <button
        type="button"
        onClick={() => {
          onRestore({
            id: 'version-3',
            versionNumber: 3,
            title: 'Restored Template',
            type: 'email',
            subject: 'Restored subject',
            content: 'Restored content',
            changedByName: 'Admin',
            createdAt: '2026-01-03T00:00:00.000Z',
          });
        }}
      >
        Restore Mock Version
      </button>
      <button
        type="button"
        onClick={() => {
          onRestore({
            id: 'version-4',
            versionNumber: 4,
            title: 'Restored No Subject',
            type: 'whatsapp',
            subject: null,
            content: 'Restored whatsapp content',
            changedByName: 'Admin',
            createdAt: '2026-01-04T00:00:00.000Z',
          });
        }}
      >
        Restore Mock Null Subject
      </button>
    </div>
  ),
}));

import { useTemplate } from '../../src/hooks/useTemplates.ts';
import { useToast } from '../../src/hooks/useToast.ts';
import { createTemplate, updateTemplate, deleteTemplate } from '../../src/api/templates.ts';

function buildTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'template-1',
    title: 'Client Welcome',
    type: 'email',
    subject: 'Welcome {{client_name}}',
    content: 'Hi {{client_name}}, {{dog_name}} is ready for pickup.',
    createdBy: 'user-1',
    createdByName: 'User',
    updatedBy: 'user-1',
    updatedByName: 'User',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage(route = '/templates/template-1'): void {
  renderWithProviders(
    <Routes>
      <Route path="/templates/new" element={<TemplateEditPage />} />
      <Route path="/templates/:id" element={<TemplateEditPage />} />
      <Route path="/templates" element={<div>Templates Index</div>} />
    </Routes>,
    {
      auth: { user: mockUser(), isAuthenticated: true },
      route,
    },
  );
}

describe('TemplateEditPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(useTemplate).mockReset();
    vi.mocked(createTemplate).mockReset();
    vi.mocked(updateTemplate).mockReset();
    vi.mocked(deleteTemplate).mockReset();
    addToast.mockReset();

    vi.mocked(useToast).mockReturnValue({
      addToast,
      removeToast: vi.fn(),
      toasts: [],
    });
  });

  it('shows loading skeleton for existing template route while loading', () => {
    vi.mocked(useTemplate).mockReturnValue({
      template: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderWithProviders(
      <Routes>
        <Route path="/templates/:id" element={<TemplateEditPage />} />
      </Routes>,
      {
        auth: { user: mockUser(), isAuthenticated: true },
        route: '/templates/template-1',
      },
    );

    expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument();
  });

  it('shows not-found state for missing existing template', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    expect(screen.getByText('Template Not Found')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to templates' }));
    expect(window.location.pathname).toBe('/templates');
  });

  it('requires filling all variables before copy works', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate(),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Fill Variables')).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: 'Copy' });
    expect(copyButton).toBeDisabled();

    await user.type(screen.getByLabelText('Client Name'), 'Ava');
    expect(copyButton).toBeDisabled();

    await user.type(screen.getByLabelText('Dog Name'), 'Luna');
    expect(copyButton).toBeEnabled();

    await user.click(copyButton);

    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    expect(screen.getByText('Welcome Ava')).toBeInTheDocument();
    expect(screen.getByText('Hi Ava, Luna is ready for pickup.')).toBeInTheDocument();
  });

  it('keeps copy enabled when template has no variables', () => {
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Hi there.' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();

    expect(screen.queryByText('Fill Variables')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
  });

  it('creates a new template and navigates to the created route', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(createTemplate).mockResolvedValue(buildTemplate({
      id: 'template-2',
      title: 'Created Template',
      subject: null,
      content: 'Created content',
    }));

    renderPage('/templates/new');

    await user.type(screen.getByLabelText('Title'), 'Created Template');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(createTemplate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Created Template',
      }));
    });
    expect(addToast).toHaveBeenCalledWith('Template created', 'success');
    expect(window.location.pathname).toBe('/templates/template-2');
  });

  it('shows error toast when create fails', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(createTemplate).mockRejectedValue(new Error('create failed'));

    renderPage('/templates/new');

    await user.type(screen.getByLabelText('Title'), 'Will Fail');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to save template', 'error');
    });
  });

  it('updates an existing template from edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(updateTemplate).mockResolvedValue(buildTemplate({ subject: 'Welcome', content: 'Body' }));

    renderPage();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated Title');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalledWith('template-1', expect.objectContaining({ title: 'Updated Title' }));
    });
    expect(addToast).toHaveBeenCalledWith('Template updated', 'success');
  });

  it('handles delete confirmation cancel and successful delete', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteTemplate).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    vi.mocked(deleteTemplate).mockResolvedValue(undefined);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteTemplate).toHaveBeenCalledWith('template-1');
    });
    expect(addToast).toHaveBeenCalledWith('Template deleted', 'success');
    expect(window.location.pathname).toBe('/templates');
  });

  it('shows error toast when delete fails', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(deleteTemplate).mockRejectedValue(new Error('delete failed'));

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to delete template', 'error');
    });
  });

  it('opens history modal, closes it, and restores a version into edit mode', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();

    await user.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getByTestId('version-history-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close History' }));
    expect(screen.queryByTestId('version-history-modal')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.click(screen.getByRole('button', { name: 'Restore Mock Version' }));

    expect(addToast).toHaveBeenCalledWith('Restored version 3 — save to apply', 'success');
    expect(screen.getByRole('heading', { name: 'Edit Template' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Restored Template');
  });

  it('cancels edit mode and restores original template values', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ title: 'Original Title', subject: 'Subject', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Temporary Title');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'Original Title' })).toBeInTheDocument();
  });

  it('initializes null subject as empty, uses whatsapp styling, and resets null subject on cancel', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ type: 'whatsapp', subject: null, content: 'Body only' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    expect(screen.getByText('whatsapp')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const subjectInput = screen.getByLabelText('Subject Line');
    expect(subjectInput).toHaveValue('');

    await user.type(subjectInput, 'Temporary subject');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Subject Line')).toHaveValue('');
  });

  it('restores a version with null subject', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Has subject', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.click(screen.getByRole('button', { name: 'Restore Mock Null Subject' }));

    expect(screen.getByRole('heading', { name: 'Edit Template' })).toBeInTheDocument();
    expect(screen.getByLabelText('Subject Line')).toHaveValue('');
    expect(addToast).toHaveBeenCalledWith('Restored version 4 — save to apply', 'success');
  });

  it('shows both type badge with tertiary-container styling in view mode', () => {
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ type: 'both', subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();
    expect(screen.getByText('Email + WA')).toBeInTheDocument();
    expect(screen.getByText('Email + WA').className).toContain('bg-tertiary-container');
  });

  it('shows error toast when update fails', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: buildTemplate({ subject: 'Welcome', content: 'Body' }),
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
    vi.mocked(updateTemplate).mockRejectedValue(new Error('update failed'));

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to save template', 'error');
    });
  });

  it('navigates back to templates from new-template cancel and top back button', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplate).mockReturnValue({
      template: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage('/templates/new');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(window.location.pathname).toBe('/templates');

    renderPage('/templates/new');
    await user.click(screen.getByRole('button', { name: '← Back to templates' }));
    expect(window.location.pathname).toBe('/templates');
  });
});
