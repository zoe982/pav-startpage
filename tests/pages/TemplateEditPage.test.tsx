import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
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
  VersionHistoryModal: () => <div data-testid="version-history-modal" />,
}));

import { useTemplate } from '../../src/hooks/useTemplates.ts';
import { useToast } from '../../src/hooks/useToast.ts';

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

function renderPage(): void {
  renderWithProviders(
    <Routes>
      <Route path="/templates/:id" element={<TemplateEditPage />} />
    </Routes>,
    {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates/template-1',
    },
  );
}

describe('TemplateEditPage', () => {
  beforeEach(() => {
    vi.mocked(useToast).mockReturnValue({
      addToast: vi.fn(),
      removeToast: vi.fn(),
      toasts: [],
    });
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
});
