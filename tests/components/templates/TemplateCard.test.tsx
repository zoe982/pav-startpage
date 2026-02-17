import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../helpers.tsx';
import { TemplateCard } from '../../../src/components/templates/TemplateCard.tsx';
import type { Template } from '../../../src/types/template.ts';

function buildTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'template-1',
    title: 'Welcome Message',
    type: 'email',
    subject: 'Welcome',
    content: 'Hello there',
    createdBy: 'user-1',
    createdByName: 'User',
    updatedBy: 'user-1',
    updatedByName: 'User',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TemplateCard', () => {
  it('shows use-template action when variables are present', () => {
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hello {{client_name}}, {{dog_name}} is ready.',
        })}
      />,
    );

    const useLink = screen.getByRole('link', { name: 'Use template' });
    expect(useLink).toHaveAttribute('href', '/templates/template-1');
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('shows copy action when no variables are present', () => {
    renderWithProviders(<TemplateCard template={buildTemplate()} />);

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Use template' })).not.toBeInTheDocument();
  });
});
