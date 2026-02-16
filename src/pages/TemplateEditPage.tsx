import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { TemplateForm } from '../components/templates/TemplateForm.tsx';
import { CopyButton } from '../components/templates/CopyButton.tsx';
import { VersionHistoryModal } from '../components/templates/VersionHistoryModal.tsx';
import { useTemplate } from '../hooks/useTemplates.ts';
import { useToast } from '../hooks/useToast.ts';
import { createTemplate, updateTemplate, deleteTemplate } from '../api/templates.ts';
import type { TemplateFormData, TemplateVersion } from '../types/template.ts';

function getCopyText(subject: string | null, content: string, type: string): string {
  if (type === 'email' && subject) {
    return `Subject: ${subject}\n\n${content}`;
  }
  return content;
}

export function TemplateEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { template, isLoading } = useTemplate(id);

  const [isEditing, setIsEditing] = useState(isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
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

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (isNew) {
        const created = await createTemplate(formData);
        addToast('Template created', 'success');
        void navigate(`/templates/${created.id}`, { replace: true });
      } else if (id) {
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

  const handleDelete = async (): Promise<void> => {
    if (!id) return;
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await deleteTemplate(id);
      addToast('Template deleted', 'success');
      void navigate('/templates');
    } catch {
      addToast('Failed to delete template', 'error');
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

  const handleCancel = (): void => {
    if (isNew) {
      void navigate('/templates');
    } else if (template) {
      setFormData({
        title: template.title,
        type: template.type,
        subject: template.subject ?? '',
        content: template.content,
      });
      setIsEditing(false);
    }
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

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <button
          type="button"
          onClick={() => void navigate('/templates')}
          className="mb-4 text-sm text-on-surface-variant motion-standard hover:text-pav-blue"
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
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
                <CopyButton text={getCopyText(template.subject, template.content, template.type)} />
                <button
                  type="button"
                  onClick={() => { setShowVersions(true); }}
                  className="rounded-md px-3 py-1 text-xs font-medium text-on-surface-variant motion-standard hover:bg-pav-tan/20"
                >
                  History
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(true); }}
                  className="state-layer rounded-md bg-pav-blue px-3 py-1 text-xs font-medium text-on-primary motion-standard hover:bg-pav-blue/90"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md px-3 py-1 text-xs font-medium text-error motion-standard hover:bg-error-container"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mt-6 rounded-lg border border-pav-tan/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-elevation-1)]">
              {template.type === 'email' && template.subject && (
                <div className="mb-4 border-b border-pav-tan/20 pb-4">
                  <span className="text-xs font-medium text-outline">SUBJECT</span>
                  <p className="mt-1 text-sm font-medium text-on-surface">{template.subject}</p>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
                {template.content}
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
