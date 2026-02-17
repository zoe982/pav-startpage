import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatesPage } from '../../src/pages/TemplatesPage.tsx';
import type { Template } from '../../src/types/template.ts';
import { renderWithProviders, mockUser } from '../helpers.tsx';

vi.mock('../../src/hooks/useTemplates.ts', () => ({
  useTemplates: vi.fn(),
}));

import { useTemplates } from '../../src/hooks/useTemplates.ts';

function buildTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'template-1',
    title: 'Template Title',
    type: 'email',
    subject: null,
    content: 'Template body',
    createdBy: 'u1',
    createdByName: 'User',
    updatedBy: 'u1',
    updatedByName: 'User',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.mocked(useTemplates).mockReset();
  });

  it('shows loading skeleton rows while templates load', () => {
    vi.mocked(useTemplates).mockReturnValue({
      templates: [],
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates',
    });

    expect(container.querySelectorAll('.skeleton-shimmer')).toHaveLength(5);
  });

  it('shows global empty state when no templates exist', () => {
    vi.mocked(useTemplates).mockReturnValue({
      templates: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates',
    });

    expect(screen.getByText('No templates yet. Create your first template to get started.')).toBeInTheDocument();
  });

  it('hydrates q/type/sort from URL and applies type-aware subject search', () => {
    const longTitle =
      'A very long template title designed to span two lines in dense list mode for scanning';
    vi.mocked(useTemplates).mockReturnValue({
      templates: [
        buildTemplate({
          id: 'email-1',
          title: longTitle,
          type: 'email',
          subject: 'SubjectOnlyToken',
          content: 'Email body',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
        buildTemplate({
          id: 'whatsapp-1',
          title: 'WhatsApp template',
          type: 'whatsapp',
          subject: 'SubjectOnlyToken',
          content: 'WhatsApp body',
          updatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates?q=subjectonlytoken&sort=title_asc',
    });

    expect(vi.mocked(useTemplates)).toHaveBeenCalledWith(undefined);
    expect(screen.getByPlaceholderText('Search templates')).toHaveValue('subjectonlytoken');
    expect(screen.getByRole('combobox', { name: 'Sort templates' })).toHaveValue('title_asc');
    expect(screen.getByText(longTitle).className).toContain('line-clamp-2');
    expect(screen.queryByText('WhatsApp template')).not.toBeInTheDocument();
    expect(screen.getByText('1 template')).toBeInTheDocument();
  });

  it('syncs search/filter/sort to URL and can clear filtered-empty state', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplates).mockReturnValue({
      templates: [
        buildTemplate({
          id: 'email-1',
          title: 'Boarding update',
          type: 'email',
          content: 'Boarding body',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
        buildTemplate({
          id: 'whatsapp-1',
          title: 'WhatsApp update',
          type: 'whatsapp',
          content: 'WhatsApp body',
          updatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates',
    });

    const searchInput = screen.getByPlaceholderText('Search templates');
    await user.type(searchInput, 'nohits');

    expect(window.location.search).toContain('q=nohits');
    expect(screen.getByText('No matching templates')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Email' }));
    expect(window.location.search).toContain('type=email');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort templates' }), 'title_desc');
    expect(window.location.search).toContain('sort=title_desc');

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);

    expect(window.location.search).toBe('');
    expect(screen.getByText('Boarding update')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp update')).toBeInTheDocument();
  });

  it('keeps only one row expanded at a time', async () => {
    const user = userEvent.setup();
    vi.mocked(useTemplates).mockReturnValue({
      templates: [
        buildTemplate({
          id: 'template-1',
          title: 'First row',
          content: 'First expanded preview',
          type: 'email',
          subject: null,
        }),
        buildTemplate({
          id: 'template-2',
          title: 'Second row',
          content: 'Second expanded preview',
          type: 'email',
          subject: null,
        }),
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates',
    });

    await user.click(screen.getByRole('button', { name: 'Expand First row' }));
    expect(screen.getByText('First expanded preview')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Second row' }));
    expect(screen.queryByText('First expanded preview')).not.toBeInTheDocument();
    expect(screen.getByText('Second expanded preview')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse Second row' }));
    expect(screen.queryByText('Second expanded preview')).not.toBeInTheDocument();
  });

  it('falls back to default sort when an invalid sort value is received', () => {
    vi.mocked(useTemplates).mockReturnValue({
      templates: [buildTemplate({ id: 'template-1', title: 'Only row' })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
      route: '/templates?q=boarding',
    });

    const sortSelect = screen.getByRole('combobox', { name: 'Sort templates' }) as HTMLSelectElement;
    fireEvent.change(sortSelect, { target: { value: 'not-a-real-sort-key' } });

    expect(sortSelect.value).toBe('updated_desc');
  });
});
