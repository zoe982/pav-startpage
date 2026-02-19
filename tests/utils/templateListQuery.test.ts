import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEMPLATE_SORT,
  parseTemplateListQuery,
  serializeTemplateListQuery,
} from '../../src/utils/templateListQuery.ts';

describe('templateListQuery', () => {
  it('parses defaults when query params are missing', () => {
    const state = parseTemplateListQuery(new URLSearchParams());

    expect(state).toEqual({
      q: '',
      type: 'all',
      sort: DEFAULT_TEMPLATE_SORT,
      approval: 'all',
    });
  });

  it('parses valid q, type, and sort params', () => {
    const state = parseTemplateListQuery(
      new URLSearchParams('q=boarding+ready&type=email&sort=title_desc'),
    );

    expect(state).toEqual({
      q: 'boarding ready',
      type: 'email',
      sort: 'title_desc',
      approval: 'all',
    });
  });

  it('falls back to defaults for invalid type and sort values', () => {
    const state = parseTemplateListQuery(
      new URLSearchParams('q=ok&type=sms&sort=created_desc'),
    );

    expect(state).toEqual({
      q: 'ok',
      type: 'all',
      sort: DEFAULT_TEMPLATE_SORT,
      approval: 'all',
    });
  });

  it('parses valid approval param', () => {
    const state = parseTemplateListQuery(new URLSearchParams('approval=approved'));
    expect(state.approval).toBe('approved');
  });

  it('falls back to all for invalid approval param', () => {
    const state = parseTemplateListQuery(new URLSearchParams('approval=invalid'));
    expect(state.approval).toBe('all');
  });

  it('normalizes blank query text to empty', () => {
    const state = parseTemplateListQuery(
      new URLSearchParams('q=++++'),
    );

    expect(state.q).toBe('');
  });

  it('serializes with defaults omitted', () => {
    const searchParams = serializeTemplateListQuery({
      q: '',
      type: 'all',
      sort: DEFAULT_TEMPLATE_SORT,
      approval: 'all',
    });

    expect(searchParams.toString()).toBe('');
  });

  it('serializes only non-default values', () => {
    const searchParams = serializeTemplateListQuery({
      q: 'late pickup',
      type: 'whatsapp',
      sort: 'updated_asc',
      approval: 'all',
    });

    expect(searchParams.get('q')).toBe('late pickup');
    expect(searchParams.get('type')).toBe('whatsapp');
    expect(searchParams.get('sort')).toBe('updated_asc');
    expect(searchParams.get('approval')).toBeNull();
  });

  it('serializes approval when not all', () => {
    const searchParams = serializeTemplateListQuery({
      q: '',
      type: 'all',
      sort: DEFAULT_TEMPLATE_SORT,
      approval: 'approved',
    });

    expect(searchParams.get('approval')).toBe('approved');
  });
});
