import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser } from '../helpers.tsx';
import { BrandVoicePage } from '../../src/pages/BrandVoicePage.tsx';
import type { BrandVoiceThread } from '../../src/types/brandVoice.ts';

vi.mock('../../src/components/layout/AppShell.tsx', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

vi.mock('../../src/hooks/useBrandVoice.ts', () => ({
  useBrandVoice: vi.fn(),
}));

import { useBrandVoice } from '../../src/hooks/useBrandVoice.ts';

function buildThread(overrides: Partial<BrandVoiceThread> = {}): BrandVoiceThread {
  return {
    id: 'thread-1',
    title: 'Welcome Email Draft (Zoey)',
    mode: 'draft',
    style: 'email',
    customStyleDescription: null,
    latestDraft: 'Latest draft text',
    pinnedDraft: null,
    messages: [
      { id: 'msg-1', role: 'user', content: 'Write a welcome email' },
      { id: 'msg-2', role: 'assistant', content: 'I drafted a welcome email.' },
    ],
    ...overrides,
  };
}

function mockHook(overrides: Partial<ReturnType<typeof useBrandVoice>> = {}): void {
  vi.mocked(useBrandVoice).mockReturnValue({
    threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
    activeThread: buildThread(),
    isLoading: false,
    error: null,
    loadThreads: vi.fn(),
    selectThread: vi.fn(),
    startThread: vi.fn(),
    sendMessage: vi.fn(),
    renameActiveThread: vi.fn(),
    pinActiveDraft: vi.fn(),
    clearActiveThread: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useBrandVoice>);
}

describe('BrandVoicePage', () => {
  beforeEach(() => {
    vi.mocked(useBrandVoice).mockReset();
  });

  it('loads threads on mount and renders thread + draft panel', () => {
    const loadThreads = vi.fn();
    mockHook({ loadThreads });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(loadThreads).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Brand Voice Studio' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Compose request' })).toBeInTheDocument();
    expect(screen.getByText('Welcome Email Draft (Zoey)')).toBeInTheDocument();
    expect(screen.getByText('Latest draft text')).toBeInTheDocument();
    expect(screen.getByText('I drafted a welcome email.')).toBeInTheDocument();
  });

  it('starts a thread when no active thread exists', async () => {
    const user = userEvent.setup();
    const startThread = vi.fn().mockResolvedValue(undefined);
    mockHook({
      activeThread: null,
      startThread,
      threads: [],
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByLabelText('Message'), 'Create a new client email');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(startThread).toHaveBeenCalledWith(
      'Create a new client email',
      'email',
      'draft',
      undefined,
    );
  });

  it('sends a reply when active thread exists', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    mockHook({ sendMessage });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByLabelText('Message'), 'Make it shorter');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith('Make it shorter', 'email', 'draft', undefined);
  });

  it('does not send when message is empty or whitespace', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const startThread = vi.fn().mockResolvedValue(undefined);
    mockHook({ sendMessage, startThread });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.type(screen.getByLabelText('Message'), '   ');
    const form = screen.getByLabelText('Message').closest('form');
    if (!form) {
      throw new Error('Expected message form to exist');
    }
    fireEvent.submit(form);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(startThread).not.toHaveBeenCalled();
  });

  it('passes custom style description when style is other', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    mockHook({ sendMessage });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Other' }));
    await user.type(screen.getByLabelText('Custom style'), 'LinkedIn post format');
    await user.type(screen.getByLabelText('Message'), 'Update this for LinkedIn');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith(
      'Update this for LinkedIn',
      'other',
      'draft',
      'LinkedIn post format',
    );
  });

  it('renames active thread', async () => {
    const user = userEvent.setup();
    const renameActiveThread = vi.fn().mockResolvedValue(undefined);
    mockHook({ renameActiveThread });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const titleInput = screen.getByLabelText('Thread title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Final Welcome Thread');
    await user.click(screen.getByRole('button', { name: 'Save title' }));

    expect(renameActiveThread).toHaveBeenCalledWith('Final Welcome Thread');
  });

  it('does not rename active thread when title is unchanged', async () => {
    const user = userEvent.setup();
    const renameActiveThread = vi.fn().mockResolvedValue(undefined);
    mockHook({ renameActiveThread });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Save title' }));

    expect(renameActiveThread).not.toHaveBeenCalled();
  });

  it('does not rename active thread when title is empty', async () => {
    const user = userEvent.setup();
    const renameActiveThread = vi.fn().mockResolvedValue(undefined);
    mockHook({ renameActiveThread });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const titleInput = screen.getByLabelText('Thread title');
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: 'Save title' }));

    expect(renameActiveThread).not.toHaveBeenCalled();
  });

  it('pins the latest draft via Use this draft button', async () => {
    const user = userEvent.setup();
    const pinActiveDraft = vi.fn().mockResolvedValue(undefined);
    mockHook({ pinActiveDraft });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Use this draft' }));

    expect(pinActiveDraft).toHaveBeenCalled();
  });

  it('clears selected thread when New thread is clicked', async () => {
    const user = userEvent.setup();
    const clearActiveThread = vi.fn();
    mockHook({ clearActiveThread });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'New thread' }));

    expect(clearActiveThread).toHaveBeenCalled();
  });

  it('selects a thread when clicked in thread list', async () => {
    const user = userEvent.setup();
    const selectThread = vi.fn().mockResolvedValue(undefined);
    mockHook({
      selectThread,
      activeThread: null,
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Welcome Email Draft (Zoey)' }));

    expect(selectThread).toHaveBeenCalledWith('thread-1');
  });

  it('renders actionable error banner and retries loading threads', async () => {
    const user = userEvent.setup();
    const loadThreads = vi.fn();
    mockHook({
      loadThreads,
      error: 'Failed to load threads. The service returned an unexpected error (HTTP 502). Please try again.',
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load threads.');
    await user.click(screen.getByRole('button', { name: 'Retry loading threads' }));

    expect(loadThreads).toHaveBeenCalledTimes(2);
  });

  it('shows empty and pinned states in the conversation and draft panels', () => {
    mockHook({
      activeThread: buildThread({
        messages: [],
        pinnedDraft: 'Latest draft text',
      }),
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    expect(screen.getByText('Draft pinned and ready to use.')).toBeInTheDocument();
  });

  it('uses accessible pressed state for mode toggles', async () => {
    const user = userEvent.setup();
    mockHook();

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const draftButton = screen.getByRole('button', { name: 'Draft' });
    const rewriteButton = screen.getByRole('button', { name: 'Rewrite' });

    expect(draftButton).toHaveAttribute('aria-pressed', 'true');
    expect(rewriteButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(rewriteButton);

    expect(draftButton).toHaveAttribute('aria-pressed', 'false');
    expect(rewriteButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(draftButton);

    expect(draftButton).toHaveAttribute('aria-pressed', 'true');
    expect(rewriteButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('copies latest draft text and resets copy label after timeout', async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      mockHook();

      renderWithProviders(<BrandVoicePage />, {
        auth: { user: mockUser(), isAuthenticated: true },
      });

      const copyButton = screen.getByRole('button', { name: 'Copy' });
      await act(async () => {
        copyButton.click();
        await Promise.resolve();
      });

      expect(writeText).toHaveBeenCalledWith('Latest draft text');
      expect(copyButton).toHaveTextContent('Copied');

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(copyButton).toHaveTextContent('Copy');
    } finally {
      vi.useRealTimers();
    }
  });
});
