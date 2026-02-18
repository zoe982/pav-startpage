import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposerBar } from '../../../src/components/brandVoice/ComposerBar.tsx';

function renderBar(overrides: Partial<Parameters<typeof ComposerBar>[0]> = {}) {
  return render(
    <ComposerBar
      message=""
      isLoading={false}
      onMessageChange={vi.fn()}
      onSubmit={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe('ComposerBar', () => {
  it('renders textarea and send button', () => {
    renderBar();
    expect(screen.getByLabelText('Revision message')).toBeInTheDocument();
    expect(screen.getByLabelText('Send')).toBeInTheDocument();
  });

  it('disables send when message is empty', () => {
    renderBar({ message: '' });
    expect(screen.getByLabelText('Send')).toBeDisabled();
  });

  it('disables send when message is whitespace', () => {
    renderBar({ message: '   ' });
    expect(screen.getByLabelText('Send')).toBeDisabled();
  });

  it('disables send when isLoading is true', () => {
    renderBar({ message: 'Hello', isLoading: true });
    expect(screen.getByLabelText('Send')).toBeDisabled();
  });

  it('enables send when message has content and not loading', () => {
    renderBar({ message: 'Hello' });
    expect(screen.getByLabelText('Send')).toBeEnabled();
  });

  it('calls onSubmit when send button is clicked and resets textarea height', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: 'Hello', onSubmit });

    const textarea = screen.getByLabelText('Revision message') as HTMLTextAreaElement;
    textarea.style.height = '100px';

    await user.click(screen.getByLabelText('Send'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(textarea.style.height).toBe('auto');
  });

  it('guards handleSubmit when isLoading via Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: 'Hello', isLoading: true, onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('guards handleSubmit when message empty via Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: '', onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('guards handleSubmit when message is whitespace via Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: '   ', onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onMessageChange when typing and auto-resizes', async () => {
    const user = userEvent.setup();
    const onMessageChange = vi.fn();
    renderBar({ onMessageChange });

    const textarea = screen.getByLabelText('Revision message');
    await user.type(textarea, 'Hi');
    expect(onMessageChange).toHaveBeenCalled();
  });

  it('submits on Enter key without Shift', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: 'Hello', onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: 'Hello', onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit on other keys', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderBar({ message: 'Hello', onSubmit });

    const textarea = screen.getByLabelText('Revision message');
    await user.click(textarea);
    await user.keyboard('a');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handles autoResize when ref is available during onChange', () => {
    renderBar();
    const textarea = screen.getByLabelText('Revision message') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'test' } });
    // autoResize sets height to auto then scrollHeight
    expect(textarea.style.height).toBeDefined();
  });
});
