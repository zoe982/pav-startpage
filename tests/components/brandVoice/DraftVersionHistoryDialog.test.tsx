import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BrandVoiceDraftVersion } from '../../../src/types/brandVoice.ts';
import { DraftVersionHistoryDialog } from '../../../src/components/brandVoice/DraftVersionHistoryDialog.tsx';

const versions: BrandVoiceDraftVersion[] = [
  {
    id: 'version-3',
    versionNumber: 3,
    draftText: 'Newest draft',
    source: 'manual',
    createdAt: '2026-02-17T12:30:00.000Z',
    createdByName: 'Test User',
  },
  {
    id: 'version-2',
    versionNumber: 2,
    draftText: 'Older draft',
    source: 'assistant',
    createdAt: '2026-02-17T12:00:00.000Z',
    createdByName: 'Brand Voice Colleague',
  },
];

describe('DraftVersionHistoryDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <DraftVersionHistoryDialog
        open={false}
        versions={versions}
        onClose={vi.fn()}
        onRestore={vi.fn()}
        isLoading={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows empty state when no versions exist', () => {
    render(
      <DraftVersionHistoryDialog
        open
        versions={[]}
        onClose={vi.fn()}
        onRestore={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No versions available yet.')).toBeInTheDocument();
  });

  it('disables newest restore button and restores older versions', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const onClose = vi.fn();

    render(
      <DraftVersionHistoryDialog
        open
        versions={versions}
        onClose={onClose}
        onRestore={onRestore}
        isLoading={false}
      />,
    );

    const restoreNewestButton = screen.getByRole('button', { name: 'Restore version 3' });
    const restoreOlderButton = screen.getByRole('button', { name: 'Restore version 2' });
    expect(restoreNewestButton).toBeDisabled();
    expect(restoreOlderButton).toBeEnabled();

    await user.click(restoreOlderButton);
    expect(onRestore).toHaveBeenCalledWith('version-2');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables all restore actions while loading', () => {
    render(
      <DraftVersionHistoryDialog
        open
        versions={versions}
        onClose={vi.fn()}
        onRestore={vi.fn()}
        isLoading
      />,
    );

    expect(screen.getByRole('button', { name: 'Restore version 3' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restore version 2' })).toBeDisabled();
  });
});
