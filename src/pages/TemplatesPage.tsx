import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AppShell } from '../components/layout/AppShell.tsx';
import { TemplateListRow } from '../components/templates/TemplateListRow.tsx';
import { useTemplates } from '../hooks/useTemplates.ts';
import {
  DEFAULT_TEMPLATE_SORT,
  hasTemplateListFilters,
  isTemplateSortKey,
  parseTemplateListQuery,
  serializeTemplateListQuery,
} from '../utils/templateListQuery.ts';
import type { TemplateListViewState, TemplateSortKey } from '../utils/templateListQuery.ts';
import { filterTemplatesForList, sortTemplatesForList } from '../utils/templateSearch.ts';

export type { TemplateListViewState, TemplateSortKey } from '../utils/templateListQuery.ts';

const FILTERS: { readonly value: TemplateListViewState['type']; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const SORT_OPTIONS: { readonly value: TemplateSortKey; readonly label: string }[] = [
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'updated_asc', label: 'Least recently updated' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
];

export function TemplatesPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const { templates, isLoading } = useTemplates(undefined);
  const viewState = useMemo(
    () => parseTemplateListQuery(searchParams),
    [searchParams],
  );

  const filteredAndSortedTemplates = useMemo(() => {
    const filteredTemplates = filterTemplatesForList(templates, {
      q: viewState.q,
      type: viewState.type,
    });
    return sortTemplatesForList(filteredTemplates, viewState.sort);
  }, [templates, viewState.q, viewState.sort, viewState.type]);

  const hasActiveFilters = hasTemplateListFilters(viewState);
  const resultCountLabel = `${filteredAndSortedTemplates.length} template${filteredAndSortedTemplates.length === 1 ? '' : 's'}`;

  const updateViewState = (updates: Partial<TemplateListViewState>): void => {
    setExpandedTemplateId(null);
    const nextViewState: TemplateListViewState = {
      q: updates.q ?? viewState.q,
      type: updates.type ?? viewState.type,
      sort: updates.sort ?? viewState.sort,
    };
    setSearchParams(serializeTemplateListQuery(nextViewState), { replace: true });
  };

  const clearFilters = (): void => {
    setExpandedTemplateId(null);
    setSearchParams(serializeTemplateListQuery({
      q: '',
      type: 'all',
      sort: DEFAULT_TEMPLATE_SORT,
    }), { replace: true });
  };

  const toggleExpandedTemplate = (templateId: string): void => {
    setExpandedTemplateId((currentTemplateId) =>
      currentTemplateId === templateId ? null : templateId,
    );
  };

  const showGlobalEmptyState = !isLoading && templates.length === 0;
  const showFilteredEmptyState = !isLoading && templates.length > 0 && filteredAndSortedTemplates.length === 0;

  const skeletonRows = useMemo(
    () => Array.from({ length: 5 }, (_, index) => `template-skeleton-${index}`),
    [],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pav-blue">Shared Templates</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Reusable email and WhatsApp message templates for the team.
            </p>
          </div>
          <Link
            to="/templates/new"
            className="state-layer touch-target shrink-0 rounded-md bg-pav-blue px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-blue/90"
          >
            New Template
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-[var(--shadow-elevation-1)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={viewState.q}
                onChange={(event) => {
                  updateViewState({ q: event.target.value });
                }}
                placeholder="Search templates"
                aria-label="Search templates"
                className="touch-target w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 text-sm text-on-surface shadow-[var(--shadow-elevation-1)] placeholder:text-outline motion-standard focus-visible:border-pav-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-gold/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Template type filters">
              {FILTERS.map((filterOption) => (
                <button
                  key={filterOption.value}
                  type="button"
                  aria-pressed={viewState.type === filterOption.value}
                  onClick={() => { updateViewState({ type: filterOption.value }); }}
                  className={`state-layer touch-target rounded-full px-4 py-2 text-xs font-medium motion-standard ${
                    viewState.type === filterOption.value
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-pav-cream text-on-surface hover:bg-pav-tan/30'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span>Sort</span>
              <select
                aria-label="Sort templates"
                value={viewState.sort}
                onChange={(event) => {
                  const nextSort = isTemplateSortKey(event.target.value)
                    ? event.target.value
                    : DEFAULT_TEMPLATE_SORT;
                  updateViewState({ sort: nextSort });
                }}
                className="touch-target rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface motion-standard focus-visible:border-pav-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-gold/30"
              >
                {SORT_OPTIONS.map((sortOption) => (
                  <option key={sortOption.value} value={sortOption.value}>
                    {sortOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
            <p>{resultCountLabel}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="state-layer touch-target rounded-md px-2 py-2 font-medium text-pav-blue motion-standard hover:bg-pav-tan/20"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {skeletonRows.map((skeletonRowId) => (
              <div
                key={skeletonRowId}
                className="h-24 skeleton-shimmer rounded-xl"
              />
            ))}
          </div>
        ) : showGlobalEmptyState ? (
          <p className="mt-12 text-center text-sm text-outline">
            No templates yet. Create your first template to get started.
          </p>
        ) : showFilteredEmptyState ? (
          <div className="mt-12 text-center">
            <p className="text-sm text-outline">No matching templates</p>
            <button
              type="button"
              onClick={clearFilters}
              className="state-layer touch-target mt-3 rounded-md px-3 py-2 text-sm font-medium text-pav-blue motion-standard hover:bg-pav-tan/20"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredAndSortedTemplates.map((template) => (
              <TemplateListRow
                key={template.id}
                template={template}
                isExpanded={expandedTemplateId === template.id}
                onToggleExpand={() => { toggleExpandedTemplate(template.id); }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
