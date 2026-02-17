import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';
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

vi.mock('../../src/components/brandVoice/FirstTurnSetupCard.tsx', () => ({
  FirstTurnSetupCard: ({
    onSubmit,
    onGoalChange,
    onRoughDraftChange,
    onNoDraftProvidedChange,
  }: {
    onSubmit: () => Promise<void>;
    onGoalChange: (value: string) => void;
    onRoughDraftChange: (value: string) => void;
    onNoDraftProvidedChange: (value: boolean) => void;
  }) => (
    <div>
      <button type="button" onClick={() => { void onSubmit(); }}>Submit first turn</button>
      <button type="button" onClick={() => { onGoalChange('Goal only'); }}>Set goal</button>
      <button type="button" onClick={() => { onRoughDraftChange('Seed draft'); }}>Set rough draft</button>
      <button type="button" onClick={() => { onRoughDraftChange(''); }}>Clear rough draft</button>
      <button type="button" onClick={() => { onNoDraftProvidedChange(true); }}>No draft true</button>
      <button type="button" onClick={() => { onNoDraftProvidedChange(false); }}>No draft false</button>
    </div>
  ),
}));

vi.mock('../../src/components/brandVoice/ComposerBar.tsx', () => ({
  ComposerBar: ({
    onSubmit,
    onMessageChange,
  }: {
    onSubmit: () => Promise<void>;
    onMessageChange: (value: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => { void onSubmit(); }}>Submit revision</button>
      <button type="button" onClick={() => { onMessageChange('Send this'); }}>Set revision message</button>
    </div>
  ),
}));

vi.mock('../../src/components/brandVoice/CanvasPanel.tsx', () => ({
  CanvasPanel: ({
    canvasText,
    onUndo,
    onApplyAssistantUpdate,
    onCopy,
    onCanvasChange,
    onOpenVersionHistory,
  }: {
    canvasText: string;
    onUndo: () => void;
    onApplyAssistantUpdate: () => void;
    onCopy: () => Promise<void>;
    onCanvasChange: (value: string) => void;
    onOpenVersionHistory: () => void;
  }) => (
    <div>
      <p data-testid="mock-canvas-text">{canvasText}</p>
      <button type="button" onClick={() => { onUndo(); }}>Force undo</button>
      <button type="button" onClick={() => { onApplyAssistantUpdate(); }}>Force apply</button>
      <button type="button" onClick={() => { void onCopy(); }}>Force copy</button>
      <button type="button" onClick={() => { onCanvasChange(canvasText); }}>Echo canvas</button>
      <button type="button" onClick={onOpenVersionHistory}>Open history</button>
    </div>
  ),
}));

vi.mock('../../src/components/brandVoice/DraftVersionHistoryDialog.tsx', () => ({
  DraftVersionHistoryDialog: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) => (
    open ? <button type="button" onClick={onClose}>Close history</button> : null
  ),
}));

import { useBrandVoice } from '../../src/hooks/useBrandVoice.ts';

function buildThread(overrides: Partial<BrandVoiceThread> = {}): BrandVoiceThread {
  return {
    id: 'thread-1',
    title: 'Welcome Email Draft',
    mode: 'draft',
    style: 'email',
    customStyleDescription: null,
    latestDraft: 'Latest draft text',
    pinnedDraft: null,
    draftVersions: [],
    messages: [
      { id: 'msg-1', role: 'user', content: 'Write this' },
      { id: 'msg-2', role: 'assistant', content: 'Drafted.' },
    ],
    ...overrides,
  };
}

function mockHook(overrides: Partial<ReturnType<typeof useBrandVoice>> = {}): void {
  vi.mocked(useBrandVoice).mockReturnValue({
    threads: [{ id: 'thread-1', title: 'Welcome Email Draft' }],
    activeThread: null,
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
    ...overrides,
  } as ReturnType<typeof useBrandVoice>);
}

describe('BrandVoicePage branch paths', () => {
  beforeEach(() => {
    vi.mocked(useBrandVoice).mockReset();
  });

  it('covers first-turn guard paths and setup toggle branches', async () => {
    const user = userEvent.setup();
    const startThread = vi.fn().mockResolvedValue(undefined);
    const originalInnerWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, 'innerWidth', {
      value: 1300,
      writable: true,
      configurable: true,
    });

    mockHook({
      activeThread: null,
      startThread,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Submit first turn' }));
    expect(startThread).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Set goal' }));
    await user.click(screen.getByRole('button', { name: 'Submit first turn' }));
    expect(startThread).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Set rough draft' }));
    await user.click(screen.getByRole('button', { name: 'Clear rough draft' }));
    await user.click(screen.getByRole('button', { name: 'No draft true' }));
    await user.click(screen.getByRole('button', { name: 'No draft false' }));
    await user.click(screen.getByRole('button', { name: 'No draft true' }));
    await user.click(screen.getByRole('button', { name: 'Submit first turn' }));

    expect(startThread).toHaveBeenCalledWith({
      goal: 'Goal only',
      noDraftProvided: true,
      style: 'email',
      mode: 'draft',
    });

    Object.defineProperty(globalThis, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });

  it('covers revision and canvas early-return callbacks', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: clipboardWriteText },
      configurable: true,
    });

    mockHook({
      activeThread: buildThread({ latestDraft: '' }),
      sendMessage,
    });

    renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    await user.click(screen.getByRole('button', { name: 'Submit revision' }));
    expect(sendMessage).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Force undo' }));
    await user.click(screen.getByRole('button', { name: 'Force apply' }));
    await user.click(screen.getByRole('button', { name: 'Force copy' }));
    expect(clipboardWriteText).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Echo canvas' }));
    await user.click(screen.getByRole('button', { name: 'Echo canvas' }));
  });

  it('updates clean canvas on server draft changes and covers resize, compact chat tab, and history close', async () => {
    const user = userEvent.setup();
    const originalInnerWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, 'innerWidth', {
      value: 1300,
      writable: true,
      configurable: true,
    });

    let activeThread: BrandVoiceThread | null = buildThread({ latestDraft: 'Server draft v1' });
    vi.mocked(useBrandVoice).mockImplementation(() => ({
      threads: [{ id: 'thread-1', title: 'Welcome Email Draft' }],
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
    } as ReturnType<typeof useBrandVoice>));

    const view = renderWithProviders(<BrandVoicePage />, {
      auth: { user: mockUser(), isAuthenticated: true },
    });

    expect(screen.getByTestId('mock-canvas-text')).toHaveTextContent('Server draft v1');

    activeThread = buildThread({ latestDraft: 'Server draft v2' });
    view.rerender(<BrandVoicePage />);
    expect(screen.getByTestId('mock-canvas-text')).toHaveTextContent('Server draft v2');

    await user.click(screen.getByRole('button', { name: 'Open history' }));
    expect(screen.getByRole('button', { name: 'Close history' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close history' }));
    expect(screen.queryByRole('button', { name: 'Close history' })).not.toBeInTheDocument();

    await act(async () => {
      Object.defineProperty(globalThis, 'innerWidth', {
        value: 560,
        writable: true,
        configurable: true,
      });
      globalThis.dispatchEvent(new Event('resize'));
      await Promise.resolve();
    });

    await user.click(screen.getByRole('tab', { name: 'Canvas' }));
    await user.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');

    Object.defineProperty(globalThis, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });
});
