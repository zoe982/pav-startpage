import type { Template } from '../types/template.ts';
import type { TemplateListViewState, TemplateSortKey } from './templateListQuery.ts';

interface TemplateListFilterInput {
  readonly q: string;
  readonly type: TemplateListViewState['type'];
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toSearchTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  return normalized.length > 0 ? normalized.split(' ') : [];
}

function getSearchableText(template: Template): string {
  const parts = [
    template.title,
    template.content,
  ];

  if ((template.type === 'email' || template.type === 'both') && template.subject) {
    parts.push(template.subject);
  }

  return normalizeSearchText(parts.join(' '));
}

function compareByTitle(a: Template, b: Template): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

export function filterTemplatesForList(
  templates: readonly Template[],
  filter: TemplateListFilterInput,
): Template[] {
  const tokens = toSearchTokens(filter.q);

  return templates.filter((template) => {
    if (filter.type !== 'all' && template.type !== filter.type && template.type !== 'both') {
      return false;
    }

    if (tokens.length === 0) {
      return true;
    }

    const searchableText = getSearchableText(template);
    return tokens.every((token) => searchableText.includes(token));
  });
}

export function sortTemplatesForList(
  templates: readonly Template[],
  sort: TemplateSortKey,
): Template[] {
  const sortedTemplates = [...templates];
  sortedTemplates.sort((a, b) => {
    if (sort === 'updated_desc') {
      return b.updatedAt.localeCompare(a.updatedAt) || compareByTitle(a, b);
    }

    if (sort === 'updated_asc') {
      return a.updatedAt.localeCompare(b.updatedAt) || compareByTitle(a, b);
    }

    if (sort === 'title_asc') {
      return compareByTitle(a, b) || b.updatedAt.localeCompare(a.updatedAt);
    }

    return compareByTitle(b, a) || b.updatedAt.localeCompare(a.updatedAt);
  });

  return sortedTemplates;
}
