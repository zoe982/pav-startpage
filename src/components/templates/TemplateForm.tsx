import type { JSX } from 'react';
import { MarkdownEditor } from '../wiki/MarkdownEditor.tsx';
import type { TemplateFormData, TemplateType } from '../../types/template.ts';

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
          className="mt-1 block w-full rounded-md border border-pav-grey/30 px-3 py-2 text-sm shadow-sm focus:border-pav-gold focus:ring-1 focus:ring-pav-gold focus:outline-none"
          placeholder="Template name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-pav-grey">Type</label>
        <div className="mt-1.5 flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange({ ...formData, type: opt.value }); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                formData.type === opt.value
                  ? 'bg-pav-blue text-white'
                  : 'bg-pav-cream text-pav-grey hover:bg-pav-tan/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {formData.type === 'email' && (
        <div>
          <label htmlFor="template-subject" className="block text-sm font-medium text-pav-grey">
            Subject Line
          </label>
          <input
            id="template-subject"
            type="text"
            value={formData.subject}
            onChange={(e) => { onChange({ ...formData, subject: e.target.value }); }}
            className="mt-1 block w-full rounded-md border border-pav-grey/30 px-3 py-2 text-sm shadow-sm focus:border-pav-gold focus:ring-1 focus:ring-pav-gold focus:outline-none"
            placeholder="Email subject line"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-pav-grey">Content</label>
        <div className="mt-1">
          <MarkdownEditor
            value={formData.content}
            onChange={(content) => { onChange({ ...formData, content }); }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-pav-grey/30 px-4 py-2 text-sm text-pav-grey transition hover:bg-pav-cream/50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim()}
          className="rounded-md bg-pav-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-pav-blue/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
