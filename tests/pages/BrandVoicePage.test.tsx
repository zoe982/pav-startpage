import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { renderWithProviders, mockUser } from '../helpers.tsx';
import { BrandVoicePage } from '../../src/pages/BrandVoicePage.tsx';
import type { BrandVoiceThread } from '../../src/types/brandVoice.ts';

vi.mock('../../src/components/layout/AppShell.tsx', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div data-testid="app-shell">{children}</div>,
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
    draftVersions: [
      {
        id: 'version-2',
        versionNumber: 2,
        draftText: 'Latest draft text',
        source: 'manual',
        createdAt: '2026-02-17T12:10:00.000Z',
        createdByName: 'Test User',
      },
      {
        id: 'version-1',
        versionNumber: 1,
        draftText: 'Original draft text',
        source: 'assistant',
        createdAt: '2026-02-17T12:00:00.000Z',
        createdByName: 'Brand Voice Colleague',
      },
    ],
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
    saveActiveDraft: vi.fn(),
    restoreActiveDraftVersion: vi.fn(),
    clearActiveThread: vi.fn(),
    deleteThread: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useBrandVoice>);
}

describe('BrandVoicePage', () => {
  beforeEach(() => {
    vi.mocked(useBrandVoice).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows first-turn setup card and enforces no-draft guardrail before submit', async () => {
    const user = userEvent.setup();
    const startThread = vi.fn().mockResolvedValue(undefined);
    const loadThreads = vi.fn();
    mockHook({
      activeThread: null,
      threads: [],
      startThread,
      loadThreads,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(loadThreads).toHaveBeenCalled();
    expect(screen.getByPlaceholderText('What do you want to write?')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Generate draft' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Goal'), 'Create a welcome message for new clients');
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'No draft' }));

    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(startThread).toHaveBeenCalledWith({
      goal: 'Create a welcome message for new clients',
      noDraftProvided: true,
      style: 'email',
      mode: 'draft',
    });
  });

  it('starts a thread from setup card with structured payload fields', async () => {
    const user = userEvent.setup();
    const startThread = vi.fn().mockResolvedValue(undefined);
    mockHook({
      activeThread: null,
      threads: [],
      startThread,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Other' }));
    await user.type(screen.getByLabelText('Custom output style'), 'Newsletter-friendly style');
    await user.type(screen.getByLabelText('Goal'), 'Turn this into a short newsletter update');
    await user.type(screen.getByLabelText('Rough draft'), 'Hello everyone, here is a quick update...');

    await user.click(screen.getByRole('button', { name: 'Generate draft' }));

    expect(startThread).toHaveBeenCalledWith({
      goal: 'Turn this into a short newsletter update',
      roughDraft: 'Hello everyone, here is a quick update...',
      noDraftProvided: false,
      style: 'other',
      mode: 'rewrite',
      customStyleDescription: 'Newsletter-friendly style',
    });
  });

  it('collapses setup into context bar after first generation and sends follow-up messages', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    mockHook({ sendMessage });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.queryByPlaceholderText('What do you want to write?')).not.toBeInTheDocument();
    expect(screen.getByText('Context: draft · email')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Revision message'), 'Make this more concise and warmer');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith('Make this more concise and warmer');
  });

  it('autosaves canvas edits after debounce and updates save status', async () => {
    vi.useFakeTimers();
    const saveActiveDraft = vi.fn().mockResolvedValue(undefined);
    mockHook({ saveActiveDraft });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const canvas = screen.getByLabelText('Canvas draft');
    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Latest draft text with local edits' } });
    });

    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(799);
    });
    expect(saveActiveDraft).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(saveActiveDraft).toHaveBeenCalledWith('Latest draft text with local edits');
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    expect(screen.getByText(/^(Saved|Idle)$/)).toBeInTheDocument();
  });

  it('supports undo for canvas edits', async () => {
    const user = userEvent.setup();
    mockHook();

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const canvas = screen.getByLabelText('Canvas draft');

    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Draft version 2' } });
    });

    expect(canvas).toHaveValue('Draft version 2');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(canvas).toHaveValue('Latest draft text');
  });

  it('does not keep duplicate undo entries for repeated same-value canvas edits', async () => {
    const user = userEvent.setup();
    mockHook();

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const canvas = screen.getByLabelText('Canvas draft');

    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Draft version 2' } });
    });
    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Draft version 2' } });
    });
    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Draft version 2' } });
    });

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(canvas).toHaveValue('Latest draft text');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(canvas).toHaveValue('Latest draft text');
  });

  it('does not overwrite local canvas edits when assistant draft updates until apply is clicked', async () => {
    const user = userEvent.setup();
    const loadThreads = vi.fn();
    let activeThread: BrandVoiceThread | null = buildThread({ latestDraft: 'Assistant draft v1' });

    vi.mocked(useBrandVoice).mockImplementation(() => ({
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
      activeThread,
      isLoading: false,
      error: null,
      loadThreads,
      selectThread: vi.fn(),
      startThread: vi.fn(),
      sendMessage: vi.fn(),
      renameActiveThread: vi.fn(),
      pinActiveDraft: vi.fn(),
      saveActiveDraft: vi.fn(),
      restoreActiveDraftVersion: vi.fn(),
      clearActiveThread: vi.fn(),
      deleteThread: vi.fn(),
    } as ReturnType<typeof useBrandVoice>));

    const view = renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const canvas = screen.getByLabelText('Canvas draft');

    await act(async () => {
      fireEvent.change(canvas, { target: { value: 'Manual local edits' } });
    });

    activeThread = buildThread({
      latestDraft: 'Assistant draft v2',
      messages: [
        { id: 'msg-1', role: 'user', content: 'Write a welcome email' },
        { id: 'msg-2', role: 'assistant', content: 'I drafted a welcome email.' },
        { id: 'msg-3', role: 'assistant', content: 'I also created another revision.' },
      ],
    });

    view.rerender(<BrandVoicePage />);

    expect(screen.getByLabelText('Canvas draft')).toHaveValue('Manual local edits');

    const applyButton = screen.getByRole('button', { name: 'Apply update' });
    expect(applyButton).toBeInTheDocument();

    await user.click(applyButton);

    expect(screen.getByLabelText('Canvas draft')).toHaveValue('Assistant draft v2');
    expect(screen.queryByRole('button', { name: 'Apply update' })).not.toBeInTheDocument();
  });

  it('applies assistant draft updates immediately when there are no unsaved local edits', () => {
    let activeThread: BrandVoiceThread | null = buildThread({ latestDraft: 'Assistant draft v1' });

    vi.mocked(useBrandVoice).mockImplementation(() => ({
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
      activeThread,
      isLoading: false,
      error: null,
      loadThreads: vi.fn(),
      selectThread: vi.fn(),
      startThread: vi.fn(),
      sendMessage: vi.fn(),
      renameActiveThread: vi.fn(),
      pinActiveDraft: vi.fn(),
      saveActiveDraft: vi.fn(),
      restoreActiveDraftVersion: vi.fn(),
      clearActiveThread: vi.fn(),
      deleteThread: vi.fn(),
    } as ReturnType<typeof useBrandVoice>));

    const view = renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByLabelText('Canvas draft')).toHaveValue('Assistant draft v1');

    activeThread = buildThread({ latestDraft: 'Assistant draft v2' });
    view.rerender(<BrandVoicePage />);

    expect(screen.getByLabelText('Canvas draft')).toHaveValue('Assistant draft v2');
    expect(screen.queryByRole('button', { name: 'Apply update' })).not.toBeInTheDocument();
  });

  it('opens draft version history and restores selected version', async () => {
    const user = userEvent.setup();
    const restoreActiveDraftVersion = vi.fn().mockResolvedValue(undefined);
    mockHook({ restoreActiveDraftVersion });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'History' }));

    const dialog = screen.getByRole('dialog', { name: 'Draft version history' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('v2 · manual')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Restore version 1' }));

    expect(restoreActiveDraftVersion).toHaveBeenCalledWith('version-1');

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Draft version history' })).not.toBeInTheDocument();
  });

  it('opens and closes draft version history without restoring a version', async () => {
    const user = userEvent.setup();
    mockHook();

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'History' }));
    const dialog = screen.getByRole('dialog', { name: 'Draft version history' });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Draft version history' })).not.toBeInTheDocument();
  });

  it('keeps rename, copy, and pin actions working in redesigned layout', async () => {
    const user = userEvent.setup();
    const renameActiveThread = vi.fn().mockResolvedValue(undefined);
    const pinActiveDraft = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    mockHook({ renameActiveThread, pinActiveDraft });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    const renameInput = screen.getByLabelText('Thread title');
    await user.clear(renameInput);
    await user.type(renameInput, 'Final Welcome Thread{Enter}');

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await user.click(screen.getByRole('button', { name: 'Pin draft' }));

    expect(renameActiveThread).toHaveBeenCalledWith('Final Welcome Thread');
    expect(writeText).toHaveBeenCalledWith('Latest draft text');
    expect(pinActiveDraft).toHaveBeenCalled();
  });

  it('renders compact chat/canvas tabs with thread sheet control in compact view', async () => {
    const user = userEvent.setup();
    const selectThread = vi.fn();
    const originalInnerWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, 'innerWidth', {
      value: 560,
      writable: true,
      configurable: true,
    });

    mockHook({
      activeThread: null,
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
      selectThread,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Canvas' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Threads' }));
    const threadDialog = screen.getByRole('dialog', { name: 'Thread list' });
    expect(threadDialog).toBeInTheDocument();

    await user.click(within(threadDialog).getByRole('button', { name: 'Welcome Email Draft (Zoey)' }));
    expect(selectThread).toHaveBeenCalledWith('thread-1');
    expect(screen.queryByRole('dialog', { name: 'Thread list' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Threads' }));
    const reopenedDialog = screen.getByRole('dialog', { name: 'Thread list' });
    await user.click(within(reopenedDialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Thread list' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Canvas' }));
    expect(screen.getByRole('tab', { name: 'Canvas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Canvas draft')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');

    Object.defineProperty(globalThis, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });

  it('starts a fresh thread workflow when New thread is clicked', async () => {
    const user = userEvent.setup();
    let activeThread: BrandVoiceThread | null = buildThread();
    const clearActiveThread = vi.fn().mockImplementation(() => {
      activeThread = null;
    });

    vi.mocked(useBrandVoice).mockImplementation(() => ({
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft (Zoey)' }],
      activeThread,
      isLoading: false,
      error: null,
      loadThreads: vi.fn(),
      selectThread: vi.fn(),
      startThread: vi.fn(),
      sendMessage: vi.fn(),
      renameActiveThread: vi.fn(),
      pinActiveDraft: vi.fn(),
      saveActiveDraft: vi.fn(),
      restoreActiveDraftVersion: vi.fn(),
      clearActiveThread,
      deleteThread: vi.fn(),
    } as ReturnType<typeof useBrandVoice>));

    const view = renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'New thread' }));
    expect(clearActiveThread).toHaveBeenCalledTimes(1);

    view.rerender(<BrandVoicePage />);
    expect(screen.getByPlaceholderText('What do you want to write?')).toBeInTheDocument();
  });

  it('shows error alert and retries loading threads', async () => {
    const user = userEvent.setup();
    const loadThreads = vi.fn();
    mockHook({
      error: 'Network unavailable',
      loadThreads,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry loading threads' }));
    expect(loadThreads).toHaveBeenCalled();
  });

  it('uses expanded three-pane layout on wide screens', () => {
    const originalInnerWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, 'innerWidth', {
      value: 1280,
      writable: true,
      configurable: true,
    });

    mockHook();
    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.queryByRole('button', { name: 'Threads' })).not.toBeInTheDocument();
    expect(screen.getByText(/Threads/)).toBeInTheDocument();

    Object.defineProperty(globalThis, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });
});
