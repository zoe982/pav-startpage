import { describe, it, expect } from 'vitest';
import {
  applyTemplateVariables,
  extractTemplateVariables,
  isValidTemplateVariableName,
  toTemplateVariableLabel,
  toTemplateVariableToken,
} from '../../src/utils/templateVariables.ts';

describe('templateVariables', () => {
  it('extracts unique variables from subject and content in order', () => {
    expect(
      extractTemplateVariables(
        'Welcome {{client_name}}',
        'Hi {{client_name}}, {{dog_name}} is ready for {{arrival_date}}.',
      ),
    ).toEqual(['client_name', 'dog_name', 'arrival_date']);
  });

  it('ignores placeholders with invalid variable names', () => {
    expect(
      extractTemplateVariables(
        '{{ClientName}} {{client-name}} {{client_name}}',
        '{{dog_name}} {{client_name}}',
      ),
    ).toEqual(['client_name', 'dog_name']);
  });

  it('validates template variable names', () => {
    expect(isValidTemplateVariableName('client_name')).toBe(true);
    expect(isValidTemplateVariableName('client2_name')).toBe(true);
    expect(isValidTemplateVariableName('2client')).toBe(false);
    expect(isValidTemplateVariableName('client-name')).toBe(false);
    expect(isValidTemplateVariableName('Client_Name')).toBe(false);
  });

  it('builds token and human label from variable name', () => {
    expect(toTemplateVariableToken('dog_name')).toBe('{{dog_name}}');
    expect(toTemplateVariableLabel('dog_name')).toBe('Dog Name');
  });

  it('applies variable values and reports unresolved placeholders', () => {
    expect(
      applyTemplateVariables({
        subject: 'Welcome {{client_name}}',
        content: 'Hi {{client_name}}, {{dog_name}} is ready.',
        values: { client_name: 'Ava', dog_name: '' },
      }),
    ).toEqual({
      subject: 'Welcome Ava',
      content: 'Hi Ava, {{dog_name}} is ready.',
      unresolved: ['dog_name'],
      copyText: 'Subject: Welcome Ava\n\nHi Ava, {{dog_name}} is ready.',
    });
  });

  it('returns content-only copy text when subject is blank', () => {
    expect(
      applyTemplateVariables({
        subject: '   ',
        content: 'Hi {{client_name}}.',
        values: { client_name: 'Ava' },
      }),
    ).toEqual({
      subject: '   ',
      content: 'Hi Ava.',
      unresolved: [],
      copyText: 'Hi Ava.',
    });
  });

  it('supports map values and leaves unknown variables unresolved', () => {
    expect(
      applyTemplateVariables({
        subject: 'Hello {{client_name}}',
        content: 'Hi {{client_name}} and {{unknown_name}}.',
        values: new Map([['client_name', 'Ava']]),
      }),
    ).toEqual({
      subject: 'Hello Ava',
      content: 'Hi Ava and {{unknown_name}}.',
      unresolved: ['unknown_name'],
      copyText: 'Subject: Hello Ava\n\nHi Ava and {{unknown_name}}.',
    });
  });
});
