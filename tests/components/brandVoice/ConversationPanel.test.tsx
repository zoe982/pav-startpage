import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
        isLoading={false}
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('What would you like to write?')).toBeInTheDocument();
    expect(screen.getByText(/Start a new thread to draft or rewrite/)).toBeInTheDocument();
    expect(screen.getByText('Composer area')).toBeInTheDocument();
  });

  it('shows no-messages state for active thread without messages', () => {
    render(
      <ConversationPanel
        activeThread={buildThread()}
        isLoading
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('What would you like to write?')).toBeInTheDocument();
    expect(screen.getByLabelText('Thread title')).toBeDisabled();
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
        isLoading={false}
        onRenameThread={onRenameThread}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('Assistant reply')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Thread title');

    // Same title — should not trigger rename on blur
    await user.clear(titleInput);
    await user.type(titleInput, 'Thread title');
    await user.tab(); // blur
    expect(onRenameThread).not.toHaveBeenCalled();

    // Whitespace-only — should not trigger rename on blur
    await user.clear(titleInput);
    await user.type(titleInput, '  ');
    await user.tab(); // blur
    expect(onRenameThread).not.toHaveBeenCalled();

    // Valid new title — should rename on Enter
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated title{Enter}');
    await waitFor(() => {
      expect(onRenameThread).toHaveBeenCalledWith('Updated title');
    });
  });

  it('does not rename when thread title input has no name attribute', () => {
    const onRenameThread = vi.fn().mockResolvedValue(undefined);

    render(
      <ConversationPanel
        activeThread={buildThread()}
        isLoading={false}
        onRenameThread={onRenameThread}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    const titleInput = screen.getByLabelText('Thread title');
    titleInput.removeAttribute('name');

    // Blur with same title — should not rename
    titleInput.focus();
    titleInput.blur();
    expect(onRenameThread).not.toHaveBeenCalled();
  });

  it('renders context chips for mode and style', () => {
    render(
      <ConversationPanel
        activeThread={buildThread({ mode: 'draft', style: 'email' })}
        isLoading={false}
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows typing indicator when loading with active messages', () => {
    render(
      <ConversationPanel
        activeThread={buildThread({
          messages: [
            { id: 'user-1', role: 'user', content: 'User message' },
          ],
        })}
        isLoading
        onRenameThread={vi.fn()}
      >
        <div>Composer area</div>
      </ConversationPanel>,
    );

    expect(screen.getByLabelText('Generating response')).toBeInTheDocument();
  });
});
