import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateForm } from '../../../src/components/templates/TemplateForm.tsx';
import type { TemplateFormData } from '../../../src/types/template.ts';

vi.mock('../../../src/components/wiki/MarkdownEditor.tsx', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="template-content"
      value={value}
      onChange={(event) => { onChange(event.target.value); }}
    />
  ),
}));

function buildFormData(overrides: Partial<TemplateFormData> = {}): TemplateFormData {
  return {
    title: 'Welcome',
    type: 'email',
    subject: 'Welcome {{client_name}}',
    content: 'Hi {{client_name}}, {{dog_name}} is ready.',
    ...overrides,
  };
}

describe('TemplateForm', () => {
  it('renders variables guidance and detected variables', () => {
    render(
      <TemplateForm
        formData={buildFormData()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    expect(screen.getByText('Variables')).toBeInTheDocument();
    expect(screen.getAllByText('{{client_name}}').length).toBeGreaterThan(0);
    expect(screen.getByText('{{dog_name}}')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject Line')).toBeInTheDocument();
  });

  it('shows empty-state helper when no placeholders are defined', () => {
    render(
      <TemplateForm
        formData={buildFormData({ subject: '', content: 'No placeholders here.' })}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    expect(screen.getByText('No variables defined yet.')).toBeInTheDocument();
  });

  it('calls submit and cancel handlers', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <TemplateForm
        formData={buildFormData()}
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('emits onChange updates for title, type, subject, and content', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TemplateForm
        formData={buildFormData()}
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Welcome updated' } });
    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    fireEvent.change(screen.getByLabelText('Subject Line'), { target: { value: 'Welcome {{client_name}}!' } });
    fireEvent.change(screen.getByTestId('template-content'), {
      target: { value: 'Hi {{client_name}}, {{dog_name}} is ready. more' },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome updated' }));
    // Email is already selected; clicking WhatsApp adds it → type becomes 'both'
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'both' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Welcome {{client_name}}!' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ content: 'Hi {{client_name}}, {{dog_name}} is ready. more' }));
  });

  it('does nothing when clicking the already-selected sole type', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TemplateForm
        formData={buildFormData({ type: 'email' })}
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Email' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('deselects one type when both are active, leaving the other', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TemplateForm
        formData={buildFormData({ type: 'both' })}
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Email' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'whatsapp' }));
  });

  it('shows both buttons as selected when type is both', () => {
    render(
      <TemplateForm
        formData={buildFormData({ type: 'both' })}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="Save"
      />,
    );

    const emailBtn = screen.getByRole('button', { name: 'Email' });
    const whatsappBtn = screen.getByRole('button', { name: 'WhatsApp' });
    expect(emailBtn.className).toContain('bg-secondary-container');
    expect(whatsappBtn.className).toContain('bg-secondary-container');
  });

  it('shows saving label and keeps submit disabled while submitting', () => {
    render(
      <TemplateForm
        formData={buildFormData({ title: 'Valid title' })}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting
        submitLabel="Save"
      />,
    );

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});
