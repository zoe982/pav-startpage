import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../helpers.tsx';
import { TemplateListRow } from '../../../src/components/templates/TemplateListRow.tsx';
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

describe('TemplateListRow', () => {
  it('shows use-template action when variables are present', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hello {{client_name}}, {{dog_name}} is ready.',
        })}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.getByRole('link', { name: 'Use template' })).toHaveAttribute('href', '/templates/template-1');
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('shows copy action with subject + content for templates without variables', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Flight ready',
          content: 'Body copy',
        })}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Subject: Flight ready\n\nBody copy');
  });

  it('renders expanded preview details including subject and variable hints for email templates', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hi {{client_name}}, your trip for {{dog_name}} is confirmed.',
        })}
        isExpanded
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.getByText('Welcome {{client_name}}')).toBeInTheDocument();
    expect(screen.getByText('Variables: client_name, dog_name')).toBeInTheDocument();
    expect(screen.getByText('Hi {{client_name}}, your trip for {{dog_name}} is confirmed.')).toBeInTheDocument();
  });

  it('never renders subject preview for WhatsApp templates', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          type: 'whatsapp',
          subject: 'Hidden subject',
          content: 'WhatsApp preview body',
        })}
        isExpanded
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.queryByText('Hidden subject')).not.toBeInTheDocument();
    expect(screen.getByText('WhatsApp preview body')).toBeInTheDocument();
  });

  it('renders singular variable count when only one variable exists', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hello there',
        })}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />,
    );

    expect(screen.getByText('1 variable')).toBeInTheDocument();
  });
});
