import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VersionHistoryModal } from '../../../src/components/templates/VersionHistoryModal.tsx';

vi.mock('../../../src/api/templates.ts', () => ({
  fetchTemplateVersions: vi.fn(),
}));

import { fetchTemplateVersions } from '../../../src/api/templates.ts';

describe('VersionHistoryModal', () => {
  beforeEach(() => {
    vi.mocked(fetchTemplateVersions).mockReset();
  });

  it('shows loading state then empty state', async () => {
    vi.mocked(fetchTemplateVersions).mockResolvedValue([]);

    render(
      <VersionHistoryModal
        templateId="template-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('No version history available.')).toBeInTheDocument();
    });
  });

  it('renders versions and restores a selected older version', async () => {
    const onRestore = vi.fn();
    const user = userEvent.setup();
    vi.mocked(fetchTemplateVersions).mockResolvedValue([
      {
        id: 'v2',
        versionNumber: 2,
        title: 'Latest',
        type: 'email',
        subject: 'Latest subject',
        content: 'Latest content',
        changedByName: 'Admin',
        createdAt: '2026-01-02T10:00:00.000Z',
      },
      {
        id: 'v1',
        versionNumber: 1,
        title: 'Older',
        type: 'whatsapp',
        subject: null,
        content: 'Older content',
        changedByName: 'Agent',
        createdAt: '2026-01-01T10:00:00.000Z',
      },
    ]);

    render(
      <VersionHistoryModal
        templateId="template-1"
        onClose={vi.fn()}
        onRestore={onRestore}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Latest')).toBeInTheDocument();
    });

    expect(screen.getByText('Latest subject')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore this version' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /v1/i }));
    expect(screen.getByText('Older')).toBeInTheDocument();
    expect(screen.getByText('Older content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restore this version' }));
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', versionNumber: 1 }),
    );
  });

  it('calls onClose from close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    vi.mocked(fetchTemplateVersions).mockResolvedValue([]);

    const { container } = render(
      <VersionHistoryModal
        templateId="template-1"
        onClose={onClose}
        onRestore={vi.fn()}
      />,
    );

    const closeButton = container.querySelector('button');
    expect(closeButton).not.toBeNull();
    if (!closeButton) {
      throw new Error('Expected close button');
    }

    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles malformed non-empty version payload without selecting an item', async () => {
    const malformed = {
      0: undefined,
      length: 1,
      map: () => [],
    } as unknown as Awaited<ReturnType<typeof fetchTemplateVersions>>;
    vi.mocked(fetchTemplateVersions).mockResolvedValue(malformed);

    render(
      <VersionHistoryModal
        templateId="template-1"
        onClose={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Restore this version' })).not.toBeInTheDocument();
  });
});
