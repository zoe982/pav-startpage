import type { JSX } from 'react';
import { MarkdownEditor } from '../wiki/MarkdownEditor.tsx';
import type { TemplateFormData, TemplateType } from '../../types/template.ts';
import { extractTemplateVariables, toTemplateVariableToken } from '../../utils/templateVariables.ts';

interface TemplateFormProps {
  readonly formData: TemplateFormData;
  readonly onChange: (data: TemplateFormData) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
  readonly submitLabel: string;
}

const TYPE_OPTIONS: { readonly value: TemplateType; readonly label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function TemplateForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: TemplateFormProps): JSX.Element {
  const variables = extractTemplateVariables(formData.subject, formData.content);

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="template-title" className="block text-sm font-medium text-pav-grey">
          Title
        </label>
        <input
          id="template-title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => { onChange({ ...formData, title: e.target.value }); }}
          className="touch-target mt-1 block w-full rounded-md border border-pav-grey/30 px-4 py-2 text-sm focus-visible:border-pav-gold focus-visible:ring-1 focus-visible:ring-pav-gold focus-visible:outline-none"
          placeholder="Template name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-pav-grey">Type</label>
        <div className="mt-2 flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const other: TemplateType = opt.value === 'email' ? 'whatsapp' : 'email';
                if (formData.type === opt.value) {
                  // Already the sole selection — do nothing (must keep at least one)
                } else if (formData.type === 'both') {
                  // Deselect this one, keep the other
                  onChange({ ...formData, type: other });
                } else {
                  // Currently the other one is selected — selecting this means both
                  onChange({ ...formData, type: 'both' });
                }
              }}
              className={`state-layer touch-target rounded-full px-4 py-2 text-xs font-medium motion-standard ${
                formData.type === opt.value || formData.type === 'both'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-pav-cream text-on-surface hover:bg-pav-tan/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="template-subject" className="block text-sm font-medium text-pav-grey">
          Subject Line
        </label>
        <input
          id="template-subject"
          type="text"
          value={formData.subject}
          onChange={(e) => { onChange({ ...formData, subject: e.target.value }); }}
          className="touch-target mt-1 block w-full rounded-md border border-pav-grey/30 px-4 py-2 text-sm focus-visible:border-pav-gold focus-visible:ring-1 focus-visible:ring-pav-gold focus-visible:outline-none"
          placeholder="Optional subject (supports {{client_name}})"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-pav-grey">Content</label>
        <div className="mt-1">
          <MarkdownEditor
            value={formData.content}
            onChange={(content) => { onChange({ ...formData, content }); }}
          />
        </div>
      </div>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <h2 className="text-sm font-semibold text-pav-blue">Variables</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Define placeholders directly in subject or content using
          {' '}
          <code className="rounded bg-surface-container-high px-1 py-0.5 text-xs">{toTemplateVariableToken('client_name')}</code>
          .
          Use lowercase letters, numbers, and underscores only.
        </p>
        {variables.length === 0 ? (
          <p className="mt-3 text-xs text-outline">No variables defined yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {variables.map((variableName) => (
              <span
                key={variableName}
                className="rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container"
              >
                {toTemplateVariableToken(variableName)}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="state-layer touch-target rounded-md border border-pav-grey/30 px-4 py-2 text-sm text-pav-grey motion-standard hover:bg-pav-cream/50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim()}
          className="state-layer touch-target rounded-md bg-pav-blue px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-blue/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
