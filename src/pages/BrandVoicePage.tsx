import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../components/layout/AppShell.tsx';
import { useBrandVoice } from '../hooks/useBrandVoice.ts';
import type { BrandMode, OutputStyle } from '../types/brandVoice.ts';
import { ThreadRail } from '../components/brandVoice/ThreadRail.tsx';
import { ConversationPanel } from '../components/brandVoice/ConversationPanel.tsx';
import { FirstTurnSetupCard } from '../components/brandVoice/FirstTurnSetupCard.tsx';
import { ComposerBar } from '../components/brandVoice/ComposerBar.tsx';
import { CanvasPanel } from '../components/brandVoice/CanvasPanel.tsx';
import { DraftVersionHistoryDialog } from '../components/brandVoice/DraftVersionHistoryDialog.tsx';

type LayoutMode = 'expanded' | 'medium' | 'compact';

type SaveStatus = 'Idle' | 'Unsaved' | 'Saving' | 'Saved';

const AUTOSAVE_DEBOUNCE_MS = 800;

function getLayoutMode(width: number): LayoutMode {
  if (width < 840) return 'compact';
  if (width < 1200) return 'medium';
  return 'expanded';
}

export function BrandVoicePage(): JSX.Element {
  const {
    threads,
    activeThread,
    isLoading,
    error,
    loadThreads,
    selectThread,
    startThread,
    sendMessage,
    renameActiveThread,
    pinActiveDraft,
    saveActiveDraft,
    restoreActiveDraftVersion,
    clearActiveThread,
  } = useBrandVoice();

  const [mode, setMode] = useState<BrandMode>('draft');
  const [style, setStyle] = useState<OutputStyle>('email');
  const [customStyleDescription, setCustomStyleDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [roughDraft, setRoughDraft] = useState('');
  const [noDraftProvided, setNoDraftProvided] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [canvasText, setCanvasText] = useState('');
  const [undoStack, setUndoStack] = useState<readonly string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('Idle');
  const [hasUnsavedCanvasEdits, setHasUnsavedCanvasEdits] = useState(false);
  const [pendingAssistantDraft, setPendingAssistantDraft] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => getLayoutMode(window.innerWidth));
  const [compactPanel, setCompactPanel] = useState<'chat' | 'canvas'>('chat');
  const [isThreadSheetOpen, setIsThreadSheetOpen] = useState(false);

  const previousThreadIdRef = useRef<string | null>(null);
  const previousServerDraftRef = useRef<string | null>(null);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const onResize = (): void => {
      setLayoutMode(getLayoutMode(window.innerWidth));
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!activeThread) {
      previousThreadIdRef.current = null;
      previousServerDraftRef.current = null;
      setCanvasText('');
      setUndoStack([]);
      setHasUnsavedCanvasEdits(false);
      setPendingAssistantDraft(null);
      setSaveStatus('Idle');
      return;
    }

    const isNewThread = previousThreadIdRef.current !== activeThread.id;
    const serverDraftChanged = previousServerDraftRef.current !== activeThread.latestDraft;

    if (isNewThread) {
      setCanvasText(activeThread.latestDraft);
      setUndoStack([]);
      setHasUnsavedCanvasEdits(false);
      setPendingAssistantDraft(null);
      setSaveStatus('Idle');
    } else if (serverDraftChanged) {
      if (hasUnsavedCanvasEdits && canvasText !== activeThread.latestDraft) {
        setPendingAssistantDraft(activeThread.latestDraft);
      } else {
        setCanvasText(activeThread.latestDraft);
        setHasUnsavedCanvasEdits(false);
        setPendingAssistantDraft(null);
        setSaveStatus('Idle');
      }
    }

    previousThreadIdRef.current = activeThread.id;
    previousServerDraftRef.current = activeThread.latestDraft;
  }, [activeThread, canvasText, hasUnsavedCanvasEdits]);

  useEffect(() => {
    if (!activeThread || !hasUnsavedCanvasEdits) return;

    if (canvasText === activeThread.latestDraft) {
      setHasUnsavedCanvasEdits(false);
      setSaveStatus('Idle');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveStatus('Saving');
      void (async () => {
        await saveActiveDraft(canvasText);
        setHasUnsavedCanvasEdits(false);
        setPendingAssistantDraft(null);
        setSaveStatus('Saved');
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeThread, canvasText, hasUnsavedCanvasEdits, saveActiveDraft]);

  const isExpanded = layoutMode === 'expanded';
  const isCompact = layoutMode === 'compact';

  const contextLabel = activeThread
    ? `Context: ${activeThread.mode} · ${activeThread.style}`
    : null;

  const handleSelectThread = useCallback((threadId: string): void => {
    void selectThread(threadId);
    setIsThreadSheetOpen(false);
  }, [selectThread]);

  const handleStartThread = useCallback(async (): Promise<void> => {
    const trimmedGoal = goal.trim();
    const trimmedRoughDraft = roughDraft.trim();
    if (!trimmedGoal) return;
    if (!trimmedRoughDraft && !noDraftProvided) return;

    await startThread({
      goal: trimmedGoal,
      ...(trimmedRoughDraft ? { roughDraft: trimmedRoughDraft } : {}),
      noDraftProvided,
      style,
      mode,
      ...(style === 'other' && customStyleDescription.trim().length > 0
        ? { customStyleDescription: customStyleDescription.trim() }
        : {}),
    });

    setGoal('');
    setRoughDraft('');
    setNoDraftProvided(false);
    setCustomStyleDescription('');
    setRevisionMessage('');
  }, [
    customStyleDescription,
    goal,
    mode,
    noDraftProvided,
    roughDraft,
    startThread,
    style,
  ]);

  const handleSendRevision = useCallback(async (): Promise<void> => {
    const text = revisionMessage.trim();
    if (!text) return;
    await sendMessage(text);
    setRevisionMessage('');
  }, [revisionMessage, sendMessage]);

  const handleNewThread = useCallback((): void => {
    clearActiveThread();
    setMode('draft');
    setStyle('email');
    setCustomStyleDescription('');
    setGoal('');
    setRoughDraft('');
    setNoDraftProvided(false);
    setRevisionMessage('');
    setCanvasText('');
    setUndoStack([]);
    setHasUnsavedCanvasEdits(false);
    setPendingAssistantDraft(null);
    setSaveStatus('Idle');
    setCompactPanel('chat');
  }, [clearActiveThread]);

  const handleCanvasChange = useCallback((nextText: string): void => {
    setUndoStack((current) => {
      if (current[current.length - 1] === canvasText) return current;
      return [...current, canvasText];
    });
    setCanvasText(nextText);
    setHasUnsavedCanvasEdits(true);
    setSaveStatus('Unsaved');
  }, [canvasText]);

  const handleUndo = useCallback((): void => {
    setUndoStack((current) => {
      const previousText = current.at(-1);
      if (previousText === undefined) return current;
      setCanvasText(previousText);
      setHasUnsavedCanvasEdits(true);
      setSaveStatus('Unsaved');
      return current.slice(0, -1);
    });
  }, []);

  const handleApplyAssistantUpdate = useCallback((): void => {
    if (!pendingAssistantDraft) return;

    setUndoStack((current) => [...current, canvasText]);
    setCanvasText(pendingAssistantDraft);
    setHasUnsavedCanvasEdits(false);
    setPendingAssistantDraft(null);
    setSaveStatus('Idle');
    previousServerDraftRef.current = pendingAssistantDraft;
  }, [canvasText, pendingAssistantDraft]);

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!canvasText.trim()) return;

    const clipboard = navigator.clipboard;

    setIsCopying(true);
    try {
      await clipboard.writeText(canvasText);
    } finally {
      setIsCopying(false);
    }
  }, [canvasText]);

  const handlePin = useCallback(async (): Promise<void> => {
    await pinActiveDraft();
  }, [pinActiveDraft]);

  const handleRestoreVersion = useCallback((versionId: string): void => {
    void (async () => {
      await restoreActiveDraftVersion(versionId);
      setIsVersionHistoryOpen(false);
    })();
  }, [restoreActiveDraftVersion]);

  const chatPane = useMemo(() => (
    <ConversationPanel
      activeThread={activeThread}
      contextLabel={contextLabel}
      isLoading={isLoading}
      onRenameThread={renameActiveThread}
    >
      {activeThread ? (
        <ComposerBar
          message={revisionMessage}
          isLoading={isLoading}
          onMessageChange={setRevisionMessage}
          onSubmit={handleSendRevision}
        />
      ) : (
        <FirstTurnSetupCard
          mode={mode}
          style={style}
          customStyleDescription={customStyleDescription}
          goal={goal}
          roughDraft={roughDraft}
          noDraftProvided={noDraftProvided}
          isLoading={isLoading}
          onModeChange={setMode}
          onStyleChange={setStyle}
          onCustomStyleDescriptionChange={setCustomStyleDescription}
          onGoalChange={setGoal}
          onRoughDraftChange={(value) => {
            setRoughDraft(value);
            if (value.trim().length > 0) {
              setNoDraftProvided(false);
            }
          }}
          onNoDraftProvidedChange={(value) => {
            setNoDraftProvided(value);
            if (value) {
              setRoughDraft('');
            }
          }}
          onSubmit={handleStartThread}
        />
      )}
    </ConversationPanel>
  ), [
    activeThread,
    contextLabel,
    customStyleDescription,
    goal,
    handleSendRevision,
    handleStartThread,
    isLoading,
    mode,
    noDraftProvided,
    renameActiveThread,
    revisionMessage,
    roughDraft,
    style,
  ]);

  const canvasPane = useMemo(() => (
    <CanvasPanel
      canvasText={canvasText}
      saveStatus={saveStatus}
      pendingAssistantDraft={pendingAssistantDraft !== null}
      canUndo={undoStack.length > 0}
      isLoading={isLoading}
      isCopying={isCopying}
      pinnedDraft={activeThread?.pinnedDraft ?? null}
      onCanvasChange={handleCanvasChange}
      onUndo={handleUndo}
      onApplyAssistantUpdate={handleApplyAssistantUpdate}
      onOpenVersionHistory={() => { setIsVersionHistoryOpen(true); }}
      onCopy={handleCopy}
      onPin={handlePin}
    />
  ), [
    activeThread?.pinnedDraft,
    canvasText,
    handleApplyAssistantUpdate,
    handleCanvasChange,
    handleCopy,
    handlePin,
    handleUndo,
    isCopying,
    isLoading,
    pendingAssistantDraft,
    saveStatus,
    undoStack.length,
  ]);

  return (
    <AppShell>
      <div className="brand-voice-page animate-fade-up space-y-5">
        <header className="rounded-3xl border border-outline-variant/50 bg-surface-container p-5 shadow-[var(--shadow-elevation-1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                Brand Voice
              </p>
              <h1 className="font-display text-3xl font-semibold text-on-surface">Brand Voice Studio</h1>
              <p className="max-w-2xl text-sm text-on-surface-variant">
                Chat, generate, and edit in one workspace with durable draft history.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isExpanded && (
                <button
                  type="button"
                  onClick={() => { setIsThreadSheetOpen(true); }}
                  className="state-layer touch-target rounded-full border border-outline px-4 py-2 text-sm text-on-surface-variant"
                >
                  Open threads
                </button>
              )}
              <button
                type="button"
                onClick={handleNewThread}
                className="state-layer touch-target rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-[var(--shadow-elevation-1)]"
              >
                New thread
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/25 bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => { void loadThreads(); }}
              disabled={isLoading}
              aria-label="Retry loading threads"
              className="state-layer touch-target rounded-full border border-on-error-container/25 px-4 py-1.5 text-xs font-semibold text-on-error-container disabled:opacity-50"
            >
              Retry loading threads
            </button>
          </div>
        )}

        {isThreadSheetOpen && !isExpanded && (
          <div role="dialog" aria-label="Thread list" className="fixed inset-0 z-30 grid place-items-center bg-scrim/35 px-3">
            <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-surface p-4 shadow-[var(--shadow-elevation-3)]">
              <h3 className="mb-3 text-lg font-semibold text-on-surface">Thread list</h3>
              <ThreadRail
                threads={threads}
                activeThreadId={activeThread?.id ?? null}
                onSelectThread={handleSelectThread}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setIsThreadSheetOpen(false); }}
                  className="state-layer touch-target rounded-full border border-outline px-3 py-1 text-xs font-semibold text-on-surface-variant"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,1fr)]">
            <ThreadRail
              threads={threads}
              activeThreadId={activeThread?.id ?? null}
              onSelectThread={handleSelectThread}
            />
            {chatPane}
            {canvasPane}
          </div>
        )}

        {!isExpanded && !isCompact && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {chatPane}
            {canvasPane}
          </div>
        )}

        {isCompact && (
          <div className="space-y-3">
            <div role="tablist" aria-label="Chat and canvas tabs" className="flex gap-2 rounded-full bg-surface-container-low p-1">
              <button
                role="tab"
                type="button"
                aria-selected={compactPanel === 'chat'}
                onClick={() => { setCompactPanel('chat'); }}
                className={`rounded-full px-4 py-2 text-sm ${compactPanel === 'chat' ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
              >
                Chat
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={compactPanel === 'canvas'}
                onClick={() => { setCompactPanel('canvas'); }}
                className={`rounded-full px-4 py-2 text-sm ${compactPanel === 'canvas' ? 'bg-primary text-on-primary' : 'text-on-surface'}`}
              >
                Canvas
              </button>
            </div>
            {compactPanel === 'chat' ? chatPane : canvasPane}
          </div>
        )}
      </div>

      <DraftVersionHistoryDialog
        open={isVersionHistoryOpen}
        versions={activeThread?.draftVersions ?? []}
        isLoading={isLoading}
        onClose={() => { setIsVersionHistoryOpen(false); }}
        onRestore={handleRestoreVersion}
      />
    </AppShell>
  );
}
