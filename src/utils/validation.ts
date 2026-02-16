import { ALLOWED_DOMAINS } from './constants.ts';

export function isAllowedEmail(email: string): boolean {
  return ALLOWED_DOMAINS.some((d) => email.endsWith(`@${d}`));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
