import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkForm } from '../../../src/components/links/LinkForm.tsx';
import type { LinkFormData } from '../../../src/types/link.ts';

describe('LinkForm', () => {
  const defaultProps = {
    onSubmit: vi.fn<(data: LinkFormData) => Promise<void>>(),
    onCancel: vi.fn(),
    isSubmitting: false,
  };

  it('renders with default empty data', () => {
    render(<LinkForm {...defaultProps} />);
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('URL')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByLabelText('Icon URL')).toHaveValue('');
    expect(screen.getByLabelText('Sort Order')).toHaveValue(0);
    expect(screen.getByLabelText('Visible')).toBeChecked();
  });

  it('renders with initial data', () => {
    const initialData: LinkFormData = {
      title: 'Test',
      url: 'https://test.com',
      description: 'Desc',
      iconUrl: 'https://icon.com/img.png',
      sortOrder: 5,
      isVisible: false,
    };
    render(<LinkForm {...defaultProps} initialData={initialData} />);
    expect(screen.getByLabelText('Title')).toHaveValue('Test');
    expect(screen.getByLabelText('URL')).toHaveValue('https://test.com');
    expect(screen.getByLabelText('Description')).toHaveValue('Desc');
    expect(screen.getByLabelText('Sort Order')).toHaveValue(5);
    expect(screen.getByLabelText('Visible')).not.toBeChecked();
  });

  it('updates fields on change', async () => {
    render(<LinkForm {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Title'), 'My Link');
    expect(screen.getByLabelText('Title')).toHaveValue('My Link');

    await user.type(screen.getByLabelText('URL'), 'https://foo.com');
    expect(screen.getByLabelText('URL')).toHaveValue('https://foo.com');

    await user.type(screen.getByLabelText('Description'), 'A desc');
    expect(screen.getByLabelText('Description')).toHaveValue('A desc');

    await user.type(screen.getByLabelText('Icon URL'), 'https://i.com/i.png');
    expect(screen.getByLabelText('Icon URL')).toHaveValue('https://i.com/i.png');

    await user.clear(screen.getByLabelText('Sort Order'));
    await user.type(screen.getByLabelText('Sort Order'), '3');
    expect(screen.getByLabelText('Sort Order')).toHaveValue(3);

    await user.click(screen.getByLabelText('Visible'));
    expect(screen.getByLabelText('Visible')).not.toBeChecked();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn<(data: LinkFormData) => Promise<void>>().mockResolvedValue(undefined);
    render(<LinkForm {...defaultProps} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Title'), 'Link');
    await user.type(screen.getByLabelText('URL'), 'https://link.com');
    await user.click(screen.getByText('Save'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Link',
      url: 'https://link.com',
    }));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<LinkForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows Saving... when isSubmitting', () => {
    render(<LinkForm {...defaultProps} isSubmitting={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('shows Save when not submitting', () => {
    render(<LinkForm {...defaultProps} isSubmitting={false} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Save')).not.toBeDisabled();
  });
});
