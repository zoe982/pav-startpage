import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
