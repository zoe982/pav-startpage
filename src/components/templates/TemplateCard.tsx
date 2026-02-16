import type { JSX } from 'react';
import { Link } from 'react-router';
import type { Template } from '../../types/template.ts';
import { CopyButton } from './CopyButton.tsx';

function getCopyText(template: Template): string {
  if (template.type === 'email' && template.subject) {
    return `Subject: ${template.subject}\n\n${template.content}`;
  }
  return template.content;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TemplateCard({ template }: { readonly template: Template }): JSX.Element {
  const preview = template.content.length > 120
    ? template.content.slice(0, 120) + '...'
    : template.content;

  return (
    <div className="state-layer group relative flex flex-col gap-2 rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-5 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]">
      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/templates/${template.id}`}
          className="flex items-center gap-2 min-w-0"
        >
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            template.type === 'email'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-success-container text-on-success-container'
          }`}>
            {template.type}
          </span>
          <h3 className="truncate text-sm font-semibold text-pav-blue group-hover:text-pav-terra">
            {template.title}
          </h3>
        </Link>
        <CopyButton text={getCopyText(template)} />
      </div>
      {template.type === 'email' && template.subject && (
        <p className="text-xs text-on-surface-variant">
          <span className="font-medium">Subject:</span> {template.subject}
        </p>
      )}
      <Link to={`/templates/${template.id}`} className="flex-1">
        <p className="text-sm text-on-surface-variant line-clamp-3">{preview}</p>
      </Link>
      <p className="text-xs text-outline">
        Updated {formatDate(template.updatedAt)} by {template.updatedByName}
      </p>
    </div>
  );
}
