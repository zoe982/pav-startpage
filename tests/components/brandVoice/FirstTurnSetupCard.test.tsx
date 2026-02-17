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

    await user.click(screen.getByRole('button', { name: 'Other style' }));
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

    await user.click(screen.getByRole('button', { name: 'Rewrite mode' }));
    expect(onModeChange).toHaveBeenCalledWith('rewrite');
    await user.click(screen.getByRole('button', { name: 'Draft mode' }));
    expect(onModeChange).toHaveBeenCalledWith('draft');

    await user.type(screen.getByLabelText('Custom output style'), 'Newsletter');
    expect(onCustomStyleDescriptionChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Goal'), 'Write a welcome email');
    expect(onGoalChange).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Rough draft'), 'Hello there');
    expect(onRoughDraftChange).toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: 'No draft available' }));
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

    const submitButton = screen.getByRole('button', { name: 'Generate aligned draft' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('blocks submit when guardrail is unmet', () => {
    const unmetSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: '',
      roughDraft: '',
      noDraftProvided: false,
      isLoading: false,
      onSubmit: unmetSubmit,
    });

    const unmetButton = screen.getByRole('button', { name: 'Generate aligned draft' });
    const unmetForm = unmetButton.closest('form');
    if (!unmetForm) throw new Error('Expected setup form');
    fireEvent.submit(unmetForm);
    expect(unmetSubmit).not.toHaveBeenCalled();
  });

  it('blocks submit while loading', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderCard({
      goal: 'Create an aligned message',
      noDraftProvided: true,
      isLoading: true,
      onSubmit,
    });

    const submitButton = screen.getByRole('button', { name: 'Generate aligned draft' });
    expect(submitButton).toBeDisabled();
    const form = submitButton.closest('form');
    if (!form) throw new Error('Expected setup form');
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
