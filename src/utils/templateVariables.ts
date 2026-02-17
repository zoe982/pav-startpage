export interface ApplyTemplateVariablesInput {
  readonly subject: string | null;
  readonly content: string;
  readonly values: Record<string, string> | ReadonlyMap<string, string>;
}

export interface ApplyTemplateVariablesResult {
  readonly subject: string | null;
  readonly content: string;
  readonly unresolved: string[];
  readonly copyText: string;
}

const VARIABLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const VARIABLE_TOKEN_PATTERN = /{{\s*([a-z][a-z0-9_]*)\s*}}/g;

export function isValidTemplateVariableName(name: string): boolean {
  return VARIABLE_NAME_PATTERN.test(name);
}

function replaceVariables(
  text: string,
  values: Record<string, string> | ReadonlyMap<string, string>,
  unresolved: Set<string>,
): string {
  return text.replaceAll(VARIABLE_TOKEN_PATTERN, (_match, variableName: string) => {
    const value = getTemplateVariableValue(values, variableName);
    if (typeof value !== 'string' || value.trim().length === 0) {
      unresolved.add(variableName);
      return `{{${variableName}}}`;
    }
    return value;
  });
}

function getTemplateVariableValue(
  values: Record<string, string> | ReadonlyMap<string, string>,
  variableName: string,
): string | undefined {
  if (values instanceof Map) {
    const mapValues = values as ReadonlyMap<string, string>;
    return mapValues.get(variableName);
  }

  const recordValues = values as Record<string, string>;
  for (const [key, value] of Object.entries(recordValues)) {
    if (key === variableName) {
      return value;
    }
  }

  return undefined;
}

export function extractTemplateVariables(subject: string | null, content: string): string[] {
  const variableNames: string[] = [];
  const seen = new Set<string>();
  const sources = [subject ?? '', content];

  for (const source of sources) {
    for (const match of source.matchAll(VARIABLE_TOKEN_PATTERN)) {
      const variableName = match[1];
      if (!variableName || seen.has(variableName)) {
        continue;
      }
      seen.add(variableName);
      variableNames.push(variableName);
    }
  }

  return variableNames;
}

export function toTemplateVariableToken(name: string): string {
  return `{{${name}}}`;
}

export function toTemplateVariableLabel(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function applyTemplateVariables(
  input: ApplyTemplateVariablesInput,
): ApplyTemplateVariablesResult {
  const unresolved = new Set<string>();
  const resolvedSubject = input.subject === null
    ? null
    : replaceVariables(input.subject, input.values, unresolved);
  const resolvedContent = replaceVariables(input.content, input.values, unresolved);

  const hasSubject = resolvedSubject !== null && resolvedSubject.trim().length > 0;
  const copyText = hasSubject
    ? `Subject: ${resolvedSubject}\n\n${resolvedContent}`
    : resolvedContent;

  return {
    subject: resolvedSubject,
    content: resolvedContent,
    unresolved: Array.from(unresolved),
    copyText,
  };
}
