import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';
import { MarkdownEditor } from '../../components/wiki/MarkdownEditor.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { fetchBrandRules, updateBrandRules } from '../../api/brandVoice.ts';

type EditorTab = 'voice' | 'services';

export function ManageBrandRulesPage(): JSX.Element {
  const { addToast } = useToast();
  const [rulesMarkdown, setRulesMarkdown] = useState('');
  const [servicesMarkdown, setServicesMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<EditorTab>('voice');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const data = await fetchBrandRules();
      setRulesMarkdown(data.rulesMarkdown);
      setServicesMarkdown(data.servicesMarkdown);
    } catch {
      addToast('Failed to load brand rules', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateBrandRules({ rulesMarkdown, servicesMarkdown });
      addToast('Brand settings saved', 'success');
    } catch {
      addToast('Failed to save brand settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="h-8 w-48 animate-pulse rounded bg-pav-tan/30" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-pav-blue">Brand Voice Rules</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage the brand guidelines and services description used by the AI writer.
          </p>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 rounded-lg bg-pav-cream p-0.5 w-fit">
            <button
              type="button"
              onClick={() => { setActiveTab('voice'); }}
              className={`state-layer touch-target rounded-md px-4 py-2 text-sm font-medium motion-standard ${
                activeTab === 'voice'
                  ? 'bg-surface-container-lowest text-pav-blue shadow-[var(--shadow-elevation-1)]'
                  : 'text-pav-grey hover:text-pav-blue'
              }`}
            >
              Voice Guide
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('services'); }}
              className={`state-layer touch-target rounded-md px-4 py-2 text-sm font-medium motion-standard ${
                activeTab === 'services'
                  ? 'bg-surface-container-lowest text-pav-blue shadow-[var(--shadow-elevation-1)]'
                  : 'text-pav-grey hover:text-pav-blue'
              }`}
            >
              Services Description
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {activeTab === 'voice' && (
              <div>
                <label className="block text-sm font-medium text-pav-grey">
                  Brand Voice Guidelines (Markdown)
                </label>
                <p className="mt-0.5 text-xs text-outline">
                  Defines tone, word choice, and writing style for the AI rewriter and drafter.
                </p>
                <div className="mt-2">
                  <MarkdownEditor
                    value={rulesMarkdown}
                    onChange={setRulesMarkdown}
                  />
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <label className="block text-sm font-medium text-pav-grey">
                  Services Description (Markdown)
                </label>
                <p className="mt-0.5 text-xs text-outline">
                  Factual reference about your services. The AI uses this to ensure accuracy when drafting or rewriting content.
                </p>
                <div className="mt-2">
                  <MarkdownEditor
                    value={servicesMarkdown}
                    onChange={setServicesMarkdown}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="state-layer touch-target rounded-md bg-pav-terra px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-terra-hover disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
