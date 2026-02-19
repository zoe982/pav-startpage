import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    approvedByEmail: null,
    approvedAt: null,
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

  it('copies content-only text when subject is empty and shows whatsapp badge styling', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          type: 'whatsapp',
          subject: null,
          content: 'WhatsApp body only',
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('WhatsApp body only');
    expect(screen.getByText('whatsapp').className).toContain('bg-success-container');
  });

  it('shows singular variable count when exactly one variable exists', () => {
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          subject: 'Welcome',
          content: 'Hi {{client_name}}',
        })}
      />,
    );

    expect(screen.getByText('1 variable to fill before copy')).toBeInTheDocument();
  });

  it('truncates long content preview with ellipsis', () => {
    const longContent = 'A'.repeat(130);
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          subject: 'Welcome',
          content: longContent,
        })}
      />,
    );

    expect(screen.getByText(`${'A'.repeat(120)}...`)).toBeInTheDocument();
  });

  it('does not truncate content that is 120 chars or less', () => {
    const shortContent = 'B'.repeat(120);
    renderWithProviders(
      <TemplateCard template={buildTemplate({ content: shortContent })} />,
    );

    expect(screen.getByText(shortContent)).toBeInTheDocument();
  });

  it('renders both type badge with tertiary-container styling', () => {
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          type: 'both',
          subject: 'Welcome',
          content: 'Hello there',
        })}
      />,
    );

    expect(screen.getByText('Email + WA')).toBeInTheDocument();
    expect(screen.getByText('Email + WA').className).toContain('bg-tertiary-container');
  });

  it('shows subject line for both type with subject', () => {
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          type: 'both',
          subject: 'Welcome back',
          content: 'Hello',
        })}
      />,
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does not show subject line for whatsapp type even with subject', () => {
    renderWithProviders(
      <TemplateCard
        template={buildTemplate({
          type: 'whatsapp',
          subject: 'Hidden',
          content: 'Hello',
        })}
      />,
    );

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
