import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatesPage } from '../../src/pages/TemplatesPage.tsx';
import { renderWithProviders, mockUser } from '../helpers.tsx';

vi.mock('../../src/hooks/useTemplates.ts', () => ({
  useTemplates: vi.fn(),
}));

vi.mock('../../src/components/templates/TemplateCard.tsx', () => ({
  TemplateCard: ({ template }: { template: { title: string } }) => (
    <article data-testid="template-card">{template.title}</article>
  ),
}));

import { useTemplates } from '../../src/hooks/useTemplates.ts';

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.mocked(useTemplates).mockReset();
  });

  it('shows loading skeletons while templates load', () => {
    vi.mocked(useTemplates).mockReturnValue({
      templates: [],
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    const { container } = renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(container.querySelectorAll('.skeleton-shimmer')).toHaveLength(3);
  });

  it('shows empty-state when no templates exist', () => {
    vi.mocked(useTemplates).mockReturnValue({
      templates: [],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByText('No templates yet. Create your first template to get started.')).toBeInTheDocument();
  });

  it('renders templates sorted by newest updated date and supports filtering', async () => {
    const calls: (string | undefined)[] = [];
    vi.mocked(useTemplates).mockImplementation((filter?: string) => {
      calls.push(filter);
      return {
        templates: [
          {
            id: 'template-1',
            title: 'Older',
            type: 'email',
            subject: 'A',
            content: 'A',
            createdBy: 'u1',
            createdByName: 'User',
            updatedBy: 'u1',
            updatedByName: 'User',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'template-2',
            title: 'Newest',
            type: 'whatsapp',
            subject: null,
            content: 'B',
            createdBy: 'u1',
            createdByName: 'User',
            updatedBy: 'u1',
            updatedByName: 'User',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      };
    });

    const user = userEvent.setup();
    renderWithProviders(<TemplatesPage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByRole('link', { name: 'New Template' })).toHaveAttribute('href', '/templates/new');
    const cards = screen.getAllByTestId('template-card');
    expect(cards[0]).toHaveTextContent('Newest');
    expect(cards[1]).toHaveTextContent('Older');

    await user.click(screen.getByRole('button', { name: 'Email' }));

    expect(calls).toContain(undefined);
    expect(calls).toContain('email');
  });
});
