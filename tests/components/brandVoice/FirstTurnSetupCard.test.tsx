import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirstTurnSetupCard } from '../../../src/components/brandVoice/FirstTurnSetupCard.tsx';

function renderCard(overrides: Partial<Parameters<typeof FirstTurnSetupCard>[0]> = {}): void {
  render(
    <FirstTurnSetupCard
      mode="draft"
      style="email"
      customStyleDescription=""
      goal=""
      roughDraft=""
      noDraftProvided={false}
      isLoading={false}
      onModeChange={vi.fn()}
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

  it('updates mode, custom style, and rough draft fields', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onCustomStyleDescriptionChange = vi.fn();
    const onRoughDraftChange = vi.fn();
    const onGoalChange = vi.fn();
    const onNoDraftProvidedChange = vi.fn();

    renderCard({
      style: 'other',
      onModeChange,
      onCustomStyleDescriptionChange,
      onRoughDraftChange,
      onGoalChange,
      onNoDraftProvidedChange,
    });

    await user.click(screen.getByRole('button', { name: 'Rewrite' }));
    expect(onModeChange).toHaveBeenCalledWith('rewrite');
    await user.click(screen.getByRole('button', { name: 'Draft' }));
    expect(onModeChange).toHaveBeenCalledWith('draft');

    await user.type(screen.getByLabelText('Custom output style'), 'Newsletter');
    expect(onCustomStyleDescriptionChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Goal'), 'Write a welcome email');
    expect(onGoalChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Attach a rough draft' }));
    await user.type(screen.getByLabelText('Rough draft'), 'Hello there');
    expect(onRoughDraftChange).toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: 'No draft' }));
    expect(onNoDraftProvidedChange).toHaveBeenCalledWith(true);
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

  it('shows draft textarea when roughDraft has content even without expanding', () => {
    renderCard({
      roughDraft: 'existing draft',
    });

    expect(screen.getByLabelText('Rough draft')).toBeInTheDocument();
    expect(screen.getByText('Draft attached')).toBeInTheDocument();
  });

  it('does not show draft textarea when not expanded and roughDraft is empty', () => {
    renderCard({
      roughDraft: '',
    });

    expect(screen.queryByLabelText('Rough draft')).not.toBeInTheDocument();
    expect(screen.getByText('Attach a rough draft')).toBeInTheDocument();
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

  it('marks the active mode button as pressed', () => {
    renderCard({ mode: 'rewrite' });

    expect(screen.getByRole('button', { name: 'Rewrite' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveAttribute('aria-pressed', 'false');
  });
});
