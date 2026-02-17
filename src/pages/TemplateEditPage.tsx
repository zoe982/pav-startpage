import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { TemplateForm } from '../components/templates/TemplateForm.tsx';
import { CopyButton } from '../components/templates/CopyButton.tsx';
import { VersionHistoryModal } from '../components/templates/VersionHistoryModal.tsx';
import { useTemplate } from '../hooks/useTemplates.ts';
import { useToast } from '../hooks/useToast.ts';
import { createTemplate, updateTemplate, deleteTemplate } from '../api/templates.ts';
import type { TemplateFormData, TemplateVersion } from '../types/template.ts';
import {
  applyTemplateVariables,
  extractTemplateVariables,
  toTemplateVariableLabel,
} from '../utils/templateVariables.ts';

export function TemplateEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { template, isLoading } = useTemplate(id);

  const [isEditing, setIsEditing] = useState(isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [variableValues, setVariableValues] = useState<ReadonlyMap<string, string>>(new Map());
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    type: 'email',
    subject: '',
    content: '',
  });
  const [formInitialized, setFormInitialized] = useState(isNew);

  // Sync template data into form when loaded
  if (template && !formInitialized) {
    setFormData({
      title: template.title,
      type: template.type,
      subject: template.subject ?? '',
      content: template.content,
    });
    setFormInitialized(true);
  }

  const variableNames = useMemo(
    () => template ? extractTemplateVariables(template.subject, template.content) : [],
    [template],
  );

  const resolvedTemplate = useMemo(
    () => template ? applyTemplateVariables({
      subject: template.subject,
      content: template.content,
      values: variableValues,
    }) : null,
    [template, variableValues],
  );
  const resolvedTemplateForView = resolvedTemplate as {
    subject: string | null;
    content: string;
    unresolved: string[];
    copyText: string;
  };

  useEffect(() => {
    setVariableValues(new Map());
  }, [template?.id, template?.updatedAt]);

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (isNew) {
        const created = await createTemplate(formData);
        addToast('Template created', 'success');
        void navigate(`/templates/${created.id}`, { replace: true });
      } else {
        await updateTemplate(id, formData);
        addToast('Template updated', 'success');
        setIsEditing(false);
        // Force page reload to get fresh data
        window.location.reload();
      }
    } catch {
      addToast('Failed to save template', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = (version: TemplateVersion): void => {
    setFormData({
      title: version.title,
      type: version.type,
      subject: version.subject ?? '',
      content: version.content,
    });
    setShowVersions(false);
    setIsEditing(true);
    addToast(`Restored version ${version.versionNumber} — save to apply`, 'success');
  };

  if (!isNew && isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-48 skeleton-shimmer rounded" />
        </div>
      </AppShell>
    );
  }

  if (!isNew && !template && !isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-pav-blue">Template Not Found</h1>
          <button
            type="button"
            onClick={() => void navigate('/templates')}
            className="mt-4 text-sm text-pav-terra hover:underline"
          >
            Back to templates
          </button>
        </div>
      </AppShell>
    );
  }

  const handleDelete = async (templateId: string): Promise<void> => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deleteTemplate(templateId);
      addToast('Template deleted', 'success');
      void navigate('/templates');
    } catch {
      addToast('Failed to delete template', 'error');
    }
  };

  const handleCancel = (): void => {
    const currentTemplate = template ?? {
      title: formData.title,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
    };

    if (isNew) {
      void navigate('/templates');
      return;
    }

    setFormData({
      title: currentTemplate.title,
      type: currentTemplate.type,
      subject: currentTemplate.subject ?? '',
      content: currentTemplate.content,
    });
    setIsEditing(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <button
          type="button"
          onClick={() => void navigate('/templates')}
          className="state-layer touch-target mb-4 rounded-md px-2 py-2 text-sm text-on-surface-variant motion-standard hover:text-pav-blue"
        >
          &larr; Back to templates
        </button>

        {isEditing ? (
          <>
            <h1 className="text-2xl font-bold text-pav-blue">
              {isNew ? 'New Template' : 'Edit Template'}
            </h1>
            <div className="mt-6">
              <TemplateForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSave}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitLabel={isNew ? 'Create' : 'Save'}
              />
            </div>
          </>
        ) : template && (
          <>
            {/* View mode */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                    template.type === 'email'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-success-container text-on-success-container'
                  }`}>
                    {template.type}
                  </span>
                  <h1 className="text-2xl font-bold text-pav-blue">{template.title}</h1>
                </div>
                <p className="mt-1 text-xs text-outline">
                  Updated by {template.updatedByName} on{' '}
                  {new Date(template.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <CopyButton
                  text={resolvedTemplateForView.copyText}
                  disabled={variableNames.length > 0 && resolvedTemplateForView.unresolved.length > 0}
                />
                <button
                  type="button"
                  onClick={() => { setShowVersions(true); }}
                  className="state-layer touch-target rounded-md px-3 py-2 text-xs font-medium text-on-surface-variant motion-standard hover:bg-pav-tan/20"
                >
                  History
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(true); }}
                  className="state-layer touch-target rounded-md bg-pav-blue px-3 py-2 text-xs font-medium text-on-primary motion-standard hover:bg-pav-blue/90"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDelete(template.id); }}
                  className="state-layer touch-target rounded-md px-3 py-2 text-xs font-medium text-error motion-standard hover:bg-error-container"
                >
                  Delete
                </button>
              </div>
            </div>

            {variableNames.length > 0 && (
              <section className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-5 shadow-[var(--shadow-elevation-1)]">
                <h2 className="text-lg font-semibold text-pav-blue">Fill Variables</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Enter values for each variable to generate a copy-ready message.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {variableNames.map((variableName) => (
                    <div key={variableName}>
                      <label
                        htmlFor={`template-variable-${variableName}`}
                        className="block text-xs font-medium text-outline"
                      >
                        {toTemplateVariableLabel(variableName)}
                      </label>
                      <input
                        id={`template-variable-${variableName}`}
                        type="text"
                        value={variableValues.get(variableName) ?? ''}
                        onChange={(event) => {
                          setVariableValues((current) => {
                            const next = new Map(current);
                            next.set(variableName, event.target.value);
                            return next;
                          });
                        }}
                        className="touch-target mt-1 block w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus-visible:border-pav-gold focus-visible:ring-1 focus-visible:ring-pav-gold focus-visible:outline-none"
                        placeholder={`Enter ${toTemplateVariableLabel(variableName).toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Content */}
            <div className="mt-6 rounded-lg border border-pav-tan/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-elevation-1)]">
              {resolvedTemplateForView.subject && resolvedTemplateForView.subject.trim().length > 0 && (
                <div className="mb-4 border-b border-pav-tan/20 pb-4">
                  <span className="text-xs font-medium text-outline">SUBJECT</span>
                  <p className="mt-1 text-sm font-medium text-on-surface">{resolvedTemplateForView.subject}</p>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
                {resolvedTemplateForView.content}
              </div>
            </div>
          </>
        )}
      </div>

      {showVersions && id && (
        <VersionHistoryModal
          templateId={id}
          onClose={() => { setShowVersions(false); }}
          onRestore={handleRestore}
        />
      )}
    </AppShell>
  );
}
