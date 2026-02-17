import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BrandVoiceThread } from '../../../src/types/brandVoice.ts';
import { ConversationPanel } from '../../../src/components/brandVoice/ConversationPanel.tsx';

function buildThread(overrides: Partial<BrandVoiceThread> = {}): BrandVoiceThread {
  return {
    id: 'thread-1',
    title: 'Thread title',
    mode: 'draft',
    style: 'email',
    customStyleDescription: null,
    latestDraft: 'Draft',
    pinnedDraft: null,
    draftVersions: [],
    messages: [],
    ...overrides,
  };
}

describe('ConversationPanel', () => {
  it('shows empty-state prompt when there is no active thread', () => {
    render(
      <ConversationPanel
        activeThread={null}
        contextLabel={null}
        isLoading={false}
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('Start a new conversation to generate your first draft.')).toBeInTheDocument();
    expect(screen.getByText('Composer area')).toBeInTheDocument();
  });

  it('shows no-messages state for active thread without messages', () => {
    render(
      <ConversationPanel
        activeThread={buildThread()}
        contextLabel="Context: draft · email"
        isLoading
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save title' })).toBeDisabled();
  });

  it('renders messages and only renames when the next title is valid and changed', async () => {
    const user = userEvent.setup();
    const onRenameThread = vi.fn().mockResolvedValue(undefined);

    render(
      <ConversationPanel
        activeThread={buildThread({
          messages: [
            { id: 'user-1', role: 'user', content: 'User message' },
            { id: 'assistant-1', role: 'assistant', content: 'Assistant reply' },
          ],
        })}
        contextLabel="Context: draft · email"
        isLoading={false}
        onRenameThread={onRenameThread}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('Assistant reply')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Thread title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Thread title');
    await user.click(screen.getByRole('button', { name: 'Save title' }));
    expect(onRenameThread).not.toHaveBeenCalled();

    await user.clear(titleInput);
    await user.type(titleInput, '  ');
    await user.click(screen.getByRole('button', { name: 'Save title' }));
    expect(onRenameThread).not.toHaveBeenCalled();

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Save title' }));
    await waitFor(() => {
      expect(onRenameThread).toHaveBeenCalledWith('Updated title');
    });
  });

  it('does not rename when thread title control is missing from the form', () => {
    const onRenameThread = vi.fn().mockResolvedValue(undefined);

    render(
      <ConversationPanel
        activeThread={buildThread()}
        contextLabel="Context: draft · email"
        isLoading={false}
        onRenameThread={onRenameThread}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    const titleInput = screen.getByLabelText('Thread title');
    titleInput.removeAttribute('name');

    const saveButton = screen.getByRole('button', { name: 'Save title' });
    const form = saveButton.closest('form');
    expect(form).not.toBeNull();
    if (!form) {
      throw new Error('Expected rename form to render when active thread exists.');
    }

    fireEvent.submit(form);
    expect(onRenameThread).not.toHaveBeenCalled();
  });
});
