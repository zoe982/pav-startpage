import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasPanel } from '../../../src/components/brandVoice/CanvasPanel.tsx';

function renderPanel(overrides: Partial<Parameters<typeof CanvasPanel>[0]> = {}): void {
  render(
    <CanvasPanel
      canvasText="Initial canvas"
      saveStatus="Idle"
      pendingAssistantDraft={false}
      canUndo={false}
      isLoading={false}
      isCopying={false}
      pinnedDraft={null}
      onCanvasChange={vi.fn()}
      onUndo={vi.fn()}
      onApplyAssistantUpdate={vi.fn()}
      onOpenVersionHistory={vi.fn()}
      onCopy={vi.fn().mockResolvedValue(undefined)}
      onPin={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe('CanvasPanel', () => {
  it('renders the saving status label', () => {
    renderPanel({ saveStatus: 'Saving' });
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('applies assistant update when pending draft action is clicked', async () => {
    const user = userEvent.setup();
    const onApplyAssistantUpdate = vi.fn();
    renderPanel({ pendingAssistantDraft: true, onApplyAssistantUpdate });

    await user.click(screen.getByRole('button', { name: 'Apply assistant update' }));
    expect(onApplyAssistantUpdate).toHaveBeenCalledTimes(1);
  });

  it('invokes copy and pin actions and handles canvas edits', async () => {
    const user = userEvent.setup();
    const onCanvasChange = vi.fn();
    const onCopy = vi.fn().mockResolvedValue(undefined);
    const onPin = vi.fn().mockResolvedValue(undefined);
    const onUndo = vi.fn();
    const onOpenVersionHistory = vi.fn();

    renderPanel({
      canUndo: true,
      onCanvasChange,
      onCopy,
      onPin,
      onUndo,
      onOpenVersionHistory,
    });

    await user.type(screen.getByLabelText('Canvas draft'), ' updated');
    expect(onCanvasChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Version history' }));
    expect(onOpenVersionHistory).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Undo edit' }));
    expect(onUndo).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Copy draft' }));
    expect(onCopy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Use this draft' }));
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('shows pinned confirmation when pinned draft exists', () => {
    renderPanel({ pinnedDraft: 'Pinned body' });
    expect(screen.getByText('Draft pinned and ready to use.')).toBeInTheDocument();
  });
});
