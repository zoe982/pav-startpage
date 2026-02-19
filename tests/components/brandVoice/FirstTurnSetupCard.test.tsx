import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirstTurnSetupCard } from '../../../src/components/brandVoice/FirstTurnSetupCard.tsx';

function renderCard(overrides: Partial<Parameters<typeof FirstTurnSetupCard>[0]> = {}): void {
  render(
    <FirstTurnSetupCard
      style="email"
      customStyleDescription=""
      goal=""
      roughDraft=""
      noDraftProvided={false}
      isLoading={false}
      onStyleChange={vi.fn()}
      onCustomStyleDescriptionChange={vi.fn()}
      onGoalChange={vi.fn()}
      onRoughDraftChange={vi.fn()}
      onNoDraftProvidedChange={vi.fn()}
      onSubmit={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe('FirstTurnSetupCard', () => {
  it('shows custom style field only for style=other', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();
    renderCard({ style: 'email', onStyleChange });

    expect(screen.queryByLabelText('Custom output style')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Other' }));
    expect(onStyleChange).toHaveBeenCalledWith('other');
  });

  it('updates custom style, and rough draft fields', async () => {
    const user = userEvent.setup();
    const onCustomStyleDescriptionChange = vi.fn();
    const onRoughDraftChange = vi.fn();
    const onGoalChange = vi.fn();

    renderCard({
      style: 'other',
      onCustomStyleDescriptionChange,
      onRoughDraftChange,
      onGoalChange,
    });

    await user.type(screen.getByLabelText('Custom output style'), 'Newsletter');
    expect(onCustomStyleDescriptionChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Goal'), 'Write a welcome email');
    expect(onGoalChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Rough draft'), 'Hello there');
    expect(onRoughDraftChange).toHaveBeenCalled();
  });

  it('"No draft" button appears in draft row and calls onNoDraftProvidedChange(true)', async () => {
    const user = userEvent.setup();
    const onNoDraftProvidedChange = vi.fn();
    const onRoughDraftChange = vi.fn();
    renderCard({ onNoDraftProvidedChange, onRoughDraftChange });

    const noDraftButton = screen.getByRole('button', { name: 'No draft' });
    expect(noDraftButton).toBeInTheDocument();

    await user.click(noDraftButton);
    expect(onNoDraftProvidedChange).toHaveBeenCalledWith(true);
    expect(onRoughDraftChange).toHaveBeenCalledWith('');
  });

  it('"add draft" link appears when noDraftProvided is true and calls onNoDraftProvidedChange(false)', async () => {
    const user = userEvent.setup();
    const onNoDraftProvidedChange = vi.fn();
    renderCard({ noDraftProvided: true, onNoDraftProvidedChange });

    expect(screen.queryByLabelText('Rough draft')).not.toBeInTheDocument();
    expect(screen.getByText(/No draft provided/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'add draft' }));
    expect(onNoDraftProvidedChange).toHaveBeenCalledWith(false);
  });

  it('"No draft" button is hidden when noDraftProvided is true', () => {
    renderCard({ noDraftProvided: true });

    expect(screen.queryByRole('button', { name: 'No draft' })).not.toBeInTheDocument();
  });

  it('enables submit only when guardrail is satisfied and loading is false', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: 'Create an aligned message',
      noDraftProvided: true,
      onSubmit,
    });

    const submitButton = screen.getByRole('button', { name: 'Generate draft' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('blocks submit when guardrail is unmet', () => {
    renderCard({
      goal: '',
      roughDraft: '',
      noDraftProvided: false,
      isLoading: false,
    });

    const submitButton = screen.getByRole('button', { name: 'Generate draft' });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
  });

  it('blocks submit while loading', () => {
    renderCard({
      goal: 'Create an aligned message',
      noDraftProvided: true,
      isLoading: true,
    });

    const submitButton = screen.getByRole('button', { name: 'Generate draft' });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
  });

  it('enables submit when goal has content and roughDraft provided', () => {
    renderCard({
      goal: 'Write a message',
      roughDraft: 'draft text',
      noDraftProvided: false,
    });

    expect(screen.getByRole('button', { name: 'Generate draft' })).toBeEnabled();
  });

  it('blocks submit when goal is whitespace only', () => {
    renderCard({
      goal: '   ',
      noDraftProvided: true,
    });

    expect(screen.getByRole('button', { name: 'Generate draft' })).toBeDisabled();
  });

  it('blocks submit when roughDraft is whitespace and noDraftProvided is false', () => {
    renderCard({
      goal: 'Write a message',
      roughDraft: '   ',
      noDraftProvided: false,
    });

    expect(screen.getByRole('button', { name: 'Generate draft' })).toBeDisabled();
  });

  it('draft textarea is visible when noDraftProvided is false', () => {
    renderCard({
      roughDraft: '',
      noDraftProvided: false,
    });

    expect(screen.getByLabelText('Rough draft')).toBeInTheDocument();
  });

  it('draft textarea is hidden when noDraftProvided is true', () => {
    renderCard({
      roughDraft: '',
      noDraftProvided: true,
    });

    expect(screen.queryByLabelText('Rough draft')).not.toBeInTheDocument();
  });

  it('submits on Enter key without Shift in goal textarea', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: 'Write a message',
      noDraftProvided: true,
      onSubmit,
    });

    const goalInput = screen.getByLabelText('Goal');
    await user.click(goalInput);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Shift+Enter in goal textarea', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: 'Write a message',
      noDraftProvided: true,
      onSubmit,
    });

    const goalInput = screen.getByLabelText('Goal');
    await user.click(goalInput);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('guards handleSubmit via Enter when canSubmit is false', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: '',
      roughDraft: '',
      noDraftProvided: false,
      onSubmit,
    });

    const goalInput = screen.getByLabelText('Goal');
    await user.click(goalInput);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('guards handleSubmit via Enter when isLoading', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: 'Write something',
      noDraftProvided: true,
      isLoading: true,
      onSubmit,
    });

    const goalInput = screen.getByLabelText('Goal');
    await user.click(goalInput);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders all style buttons', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Facebook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Other' })).toBeInTheDocument();
  });

  it('marks the active style button as pressed', () => {
    renderCard({ style: 'instagram' });

    expect(screen.getByRole('button', { name: 'Instagram' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Email' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not render Rewrite or Draft mode buttons', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: 'Rewrite' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Draft' })).not.toBeInTheDocument();
  });
});
