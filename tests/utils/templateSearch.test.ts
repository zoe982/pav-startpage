import { describe, expect, it } from 'vitest';
import type { Template } from '../../src/types/template.ts';
import {
  filterTemplatesForList,
  sortTemplatesForList,
} from '../../src/utils/templateSearch.ts';

function buildTemplate(overrides: Partial<Template>): Template {
  return {
    id: 'template-1',
    title: 'Template',
    type: 'email',
    subject: null,
    content: 'Template content',
    createdBy: 'user-1',
    createdByName: 'User 1',
    updatedBy: 'user-1',
    updatedByName: 'User 1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    approvedByEmail: null,
    approvedAt: null,
    ...overrides,
  };
}

describe('templateSearch', () => {
  it('matches tokens case-insensitively with whitespace normalization', () => {
    const templates: Template[] = [
      buildTemplate({
        id: 'match-1',
        title: 'Boarding Summary',
        content: 'Ready for pickup now',
      }),
      buildTemplate({
        id: 'no-match',
        title: 'Arrival Checklist',
        content: 'Please confirm cargo setup',
      }),
    ];

    const result = filterTemplatesForList(templates, {
      q: '   BOARDING    pickup   ',
      type: 'all',
    });

    expect(result.map((template) => template.id)).toEqual(['match-1']);
  });

  it('matches email subject text but ignores whatsapp subject text', () => {
    const templates: Template[] = [
      buildTemplate({
        id: 'email-1',
        type: 'email',
        title: 'Travel confirmation',
        subject: 'SubjectOnlyToken',
        content: 'Body text',
      }),
      buildTemplate({
        id: 'whatsapp-1',
        type: 'whatsapp',
        title: 'Chat confirmation',
        subject: 'SubjectOnlyToken',
        content: 'Body text',
      }),
    ];

    const result = filterTemplatesForList(templates, {
      q: 'subjectonlytoken',
      type: 'all',
    });

    expect(result.map((template) => template.id)).toEqual(['email-1']);
  });

  it('filters by approval status: approved shows only approved templates', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'approved-1', approvedByEmail: 'alice@example.com', approvedAt: '2026-01-10T00:00:00.000Z' }),
      buildTemplate({ id: 'unapproved-1', approvedByEmail: null }),
    ];

    const result = filterTemplatesForList(templates, {
      q: '',
      type: 'all',
      approval: 'approved',
    });

    expect(result.map((t) => t.id)).toEqual(['approved-1']);
  });

  it('filters by approval status: unapproved shows only unapproved templates', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'approved-1', approvedByEmail: 'alice@example.com', approvedAt: '2026-01-10T00:00:00.000Z' }),
      buildTemplate({ id: 'unapproved-1', approvedByEmail: null }),
    ];

    const result = filterTemplatesForList(templates, {
      q: '',
      type: 'all',
      approval: 'unapproved',
    });

    expect(result.map((t) => t.id)).toEqual(['unapproved-1']);
  });

  it('filters by selected template type', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'email-1', type: 'email' }),
      buildTemplate({ id: 'whatsapp-1', type: 'whatsapp' }),
    ];

    const result = filterTemplatesForList(templates, {
      q: '',
      type: 'whatsapp',
    });

    expect(result.map((template) => template.id)).toEqual(['whatsapp-1']);
  });

  it('sorts by updated date ascending and descending', () => {
    const templates: Template[] = [
      buildTemplate({
        id: 'older',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      buildTemplate({
        id: 'newer',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    ];

    expect(sortTemplatesForList(templates, 'updated_desc').map((template) => template.id)).toEqual([
      'newer',
      'older',
    ]);
    expect(sortTemplatesForList(templates, 'updated_asc').map((template) => template.id)).toEqual([
      'older',
      'newer',
    ]);
  });

  it('sorts by title ascending and descending', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'b', title: 'Bravo' }),
      buildTemplate({ id: 'a', title: 'alpha' }),
    ];

    expect(sortTemplatesForList(templates, 'title_asc').map((template) => template.id)).toEqual([
      'a',
      'b',
    ]);
    expect(sortTemplatesForList(templates, 'title_desc').map((template) => template.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('applies tie-breakers for updated_asc and title sorts', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'z', title: 'Zulu', updatedAt: '2026-01-02T00:00:00.000Z' }),
      buildTemplate({ id: 'a-older', title: 'Alpha', updatedAt: '2026-01-01T00:00:00.000Z' }),
      buildTemplate({ id: 'a-newer', title: 'Alpha', updatedAt: '2026-01-03T00:00:00.000Z' }),
    ];

    expect(sortTemplatesForList(templates, 'updated_asc').map((template) => template.id)).toEqual([
      'a-older',
      'z',
      'a-newer',
    ]);
    expect(sortTemplatesForList(templates, 'title_asc').map((template) => template.id)).toEqual([
      'a-newer',
      'a-older',
      'z',
    ]);
    expect(sortTemplatesForList(templates, 'title_desc').map((template) => template.id)).toEqual([
      'z',
      'a-newer',
      'a-older',
    ]);
  });

  it('uses title fallback when updated_asc timestamps match', () => {
    const templates: Template[] = [
      buildTemplate({ id: 'b', title: 'Bravo', updatedAt: '2026-01-02T00:00:00.000Z' }),
      buildTemplate({ id: 'a', title: 'Alpha', updatedAt: '2026-01-02T00:00:00.000Z' }),
    ];

    expect(sortTemplatesForList(templates, 'updated_asc').map((template) => template.id)).toEqual([
      'a',
      'b',
    ]);
  });
});
