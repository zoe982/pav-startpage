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
    approvedByEmail: null,
    approvedAt: null,
    ...overrides,
  };
}

describe('TemplateListRow', () => {
  it('renders as a card link to the template detail page', () => {
    renderWithProviders(
      <TemplateListRow template={buildTemplate()} />,
    );

    const cardLink = screen.getByRole('link', { name: /Welcome Message/i });
    expect(cardLink).toHaveAttribute('href', '/templates/template-1');
  });

  it('always shows content preview', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          content: 'Hi {{client_name}}, your trip for {{dog_name}} is confirmed.',
        })}
      />,
    );

    expect(screen.getByText('Hi {{client_name}}, your trip for {{dog_name}} is confirmed.')).toBeInTheDocument();
  });

  it('shows subject line for email templates', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hello there',
        })}
      />,
    );

    expect(screen.getByText(/Welcome \{\{client_name\}\}/)).toBeInTheDocument();
  });

  it('shows use-template action when variables are present', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          subject: 'Welcome {{client_name}}',
          content: 'Hello {{client_name}}, {{dog_name}} is ready.',
        })}
      />,
    );

    expect(screen.getByText('Use template')).toBeInTheDocument();
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
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Subject: Flight ready\n\nBody copy');
  });

  it('never renders subject preview for WhatsApp templates', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          type: 'whatsapp',
          subject: 'Hidden subject',
          content: 'WhatsApp preview body',
        })}
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
      />,
    );

    expect(screen.getByText('1 variable')).toBeInTheDocument();
  });

  it('renders both type badge with tertiary-container styling', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({ type: 'both', subject: 'Test', content: 'Body' })}
      />,
    );

    expect(screen.getByText('Email + WA')).toBeInTheDocument();
    expect(screen.getByText('Email + WA').className).toContain('bg-tertiary-container');
  });

  it('shows subject preview for both type with subject', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({ type: 'both', subject: 'Visible subject', content: 'Body' })}
      />,
    );

    expect(screen.getByText(/Visible subject/)).toBeInTheDocument();
  });

  it('does not show subject preview for both type with null subject', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({ type: 'both', subject: null, content: 'Body' })}
      />,
    );

    expect(screen.queryByText('Subject:')).not.toBeInTheDocument();
  });

  it('shows updated metadata in footer', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({
          updatedAt: '2026-01-15T00:00:00.000Z',
          updatedByName: 'Alice',
        })}
      />,
    );

    expect(screen.getByText(/Updated.*Jan 15, 2026.*by Alice/)).toBeInTheDocument();
  });

  it('shows Approved badge when approvedByEmail is set', () => {
    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({ approvedByEmail: 'alice@example.com', approvedAt: '2026-01-10T00:00:00.000Z' })}
      />,
    );

    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('does not show Approved badge when approvedByEmail is null', () => {
    renderWithProviders(
      <TemplateListRow template={buildTemplate({ approvedByEmail: null })} />,
    );

    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('copies content-only text when subject is null', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(
      <TemplateListRow
        template={buildTemplate({ subject: null, content: 'Content only' })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Content only');
  });
});
