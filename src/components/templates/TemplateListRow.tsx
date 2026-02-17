import type { JSX } from 'react';
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

interface TemplateListRowProps {
  readonly template: Template;
  readonly isExpanded: boolean;
  readonly onToggleExpand: () => void;
}

export function TemplateListRow({
  template,
  isExpanded,
  onToggleExpand,
}: TemplateListRowProps): JSX.Element {
  const variableNames = extractTemplateVariables(template.subject, template.content);
  const hasVariables = variableNames.length > 0;
  const subjectPreview = template.type === 'email' && template.subject && template.subject.trim().length > 0
    ? template.subject
    : null;
  const variableText = `${variableNames.length} variable${variableNames.length === 1 ? '' : 's'}`;

  return (
    <article className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-[var(--shadow-elevation-1)]">
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2.2fr)_auto_auto_auto] sm:items-start sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${template.title}`}
              className="state-layer touch-target-icon mt-0.5 shrink-0 rounded-md p-2 text-on-surface-variant motion-standard hover:text-on-surface"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className={`h-4 w-4 motion-standard ${isExpanded ? 'rotate-180' : ''}`}
              >
                <path d="m7 10 5 5 5-5z" />
              </svg>
            </button>

            <div className="min-w-0">
              <Link
                to={`/templates/${template.id}`}
                className="state-layer inline-flex rounded-md px-1 py-1"
              >
                <h3 className="line-clamp-2 text-sm font-semibold text-pav-blue">
                  {template.title}
                </h3>
              </Link>
              <p className="mt-1 text-xs text-outline">
                Updated {formatDate(template.updatedAt)} by {template.updatedByName}
              </p>
            </div>
          </div>
        </div>

        <span className={`justify-self-start rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
          template.type === 'email'
            ? 'bg-primary-container text-on-primary-container'
            : 'bg-success-container text-on-success-container'
        }`}>
          {template.type}
        </span>

        <span className="justify-self-start rounded-full bg-surface-container px-2 py-1 text-xs font-medium text-on-surface-variant">
          {variableText}
        </span>

        <div className="justify-self-start sm:justify-self-end">
          {hasVariables ? (
            <Link
              to={`/templates/${template.id}`}
              className="state-layer touch-target inline-flex rounded-md bg-primary-container px-3 py-2 text-xs font-medium text-on-primary-container motion-standard hover:bg-secondary-container"
            >
              Use template
            </Link>
          ) : (
            <CopyButton
              text={getCopyText(template)}
              className="state-layer touch-target rounded-md px-3 py-2 text-xs font-medium text-on-surface-variant motion-standard hover:bg-pav-tan/20"
            />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-outline-variant/60 bg-surface-container-low px-4 py-4">
          {subjectPreview && (
            <p className="text-sm text-on-surface-variant">
              <span className="font-medium text-on-surface">Subject:</span> {subjectPreview}
            </p>
          )}

          <p className="whitespace-pre-wrap text-sm text-on-surface-variant">
            {template.content}
          </p>

          <p className="text-xs text-outline">
            {hasVariables ? `Variables: ${variableNames.join(', ')}` : 'No variables required'}
          </p>
        </div>
      )}
    </article>
  );
}
