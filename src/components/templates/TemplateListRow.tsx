import type { JSX, MouseEvent } from 'react';
import { Link } from 'react-router';
import type { Template } from '../../types/template.ts';
import { extractTemplateVariables } from '../../utils/templateVariables.ts';
import { CopyButton } from './CopyButton.tsx';

function getCopyText(template: Template): string {
  if (template.subject && template.subject.trim().length > 0) {
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

function stopPropagation(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

interface TemplateListRowProps {
  readonly template: Template;
}

export function TemplateListRow({
  template,
}: TemplateListRowProps): JSX.Element {
  const variableNames = extractTemplateVariables(template.subject, template.content);
  const hasVariables = variableNames.length > 0;
  const subjectPreview = (template.type === 'email' || template.type === 'both') && template.subject && template.subject.trim().length > 0
    ? template.subject
    : null;
  const variableText = `${variableNames.length} variable${variableNames.length === 1 ? '' : 's'}`;

  return (
    <Link
      to={`/templates/${template.id}`}
      className="glass-card glass-card-interactive block p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
          template.type === 'email'
            ? 'bg-primary-container text-on-primary-container'
            : template.type === 'both'
              ? 'bg-tertiary-container text-on-tertiary-container'
              : 'bg-success-container text-on-success-container'
        }`}>
          {template.type === 'both' ? 'Email + WA' : template.type}
        </span>

        {template.approvedByEmail && (
          <span className="rounded-full bg-success-container px-2 py-1 text-xs font-semibold text-on-success-container">
            Approved
          </span>
        )}

        <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-medium text-on-surface-variant">
          {variableText}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-on-surface">
        {template.title}
      </h3>

      {subjectPreview && (
        <p className="mt-2 line-clamp-1 text-sm text-on-surface-variant">
          <span className="font-medium text-on-surface">Subject:</span> {subjectPreview}
        </p>
      )}

      <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-on-surface-variant">
        {template.content}
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-on-surface-variant">
          Updated {formatDate(template.updatedAt)} by {template.updatedByName}
        </p>

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex items-center gap-2" onClick={stopPropagation}>
          {hasVariables ? (
            <span
              className="inline-flex rounded-full bg-secondary-container px-3 py-2 text-xs font-medium text-on-secondary-container"
            >
              Use template
            </span>
          ) : (
            <CopyButton
              text={getCopyText(template)}
              className="state-layer touch-target rounded-full px-3 py-2 text-xs font-medium text-on-surface-variant motion-standard hover:bg-surface-container"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
