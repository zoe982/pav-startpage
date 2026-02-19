import type { TemplateType } from '../types/template.ts';

export type TemplateSortKey = 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';
export type TemplateApprovalFilter = 'all' | 'approved' | 'unapproved';

export interface TemplateListViewState {
  readonly q: string;
  readonly type: TemplateType | 'all';
  readonly sort: TemplateSortKey;
  readonly approval: TemplateApprovalFilter;
}

export const DEFAULT_TEMPLATE_SORT: TemplateSortKey = 'updated_desc';

function normalizeQueryText(value: string | null): string {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ');
}

export function isTemplateListType(value: string | null): value is TemplateListViewState['type'] {
  return value === 'all' || value === 'email' || value === 'whatsapp';
}

export function isTemplateApprovalFilter(value: string | null): value is TemplateApprovalFilter {
  return value === 'all' || value === 'approved' || value === 'unapproved';
}

export function isTemplateSortKey(value: string | null): value is TemplateSortKey {
  return (
    value === 'updated_desc' ||
    value === 'updated_asc' ||
    value === 'title_asc' ||
    value === 'title_desc'
  );
}

export function parseTemplateListQuery(searchParams: URLSearchParams): TemplateListViewState {
  const q = normalizeQueryText(searchParams.get('q'));
  const rawType = searchParams.get('type');
  const rawSort = searchParams.get('sort');
  const rawApproval = searchParams.get('approval');

  return {
    q,
    type: isTemplateListType(rawType) ? rawType : 'all',
    sort: isTemplateSortKey(rawSort) ? rawSort : DEFAULT_TEMPLATE_SORT,
    approval: isTemplateApprovalFilter(rawApproval) ? rawApproval : 'all',
  };
}

export function serializeTemplateListQuery(state: TemplateListViewState): URLSearchParams {
  const searchParams = new URLSearchParams();
  const normalizedQuery = normalizeQueryText(state.q);

  if (normalizedQuery.length > 0) {
    searchParams.set('q', normalizedQuery);
  }

  if (state.type !== 'all') {
    searchParams.set('type', state.type);
  }

  if (state.sort !== DEFAULT_TEMPLATE_SORT) {
    searchParams.set('sort', state.sort);
  }

  if (state.approval !== 'all') {
    searchParams.set('approval', state.approval);
  }

  return searchParams;
}

export function hasTemplateListFilters(state: TemplateListViewState): boolean {
  return serializeTemplateListQuery(state).toString().length > 0;
}
