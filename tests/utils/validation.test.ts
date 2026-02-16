import { describe, it, expect } from 'vitest';
import { isAllowedEmail, isValidUrl, slugify } from '../../src/utils/validation.ts';

describe('isAllowedEmail', () => {
  it('returns true for petairvalet.com email', () => {
    expect(isAllowedEmail('user@petairvalet.com')).toBe(true);
  });

  it('returns true for marsico.org email', () => {
    expect(isAllowedEmail('user@marsico.org')).toBe(true);
  });

  it('returns false for other domain', () => {
    expect(isAllowedEmail('user@example.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAllowedEmail('')).toBe(false);
  });

  it('returns false for partial domain match', () => {
    expect(isAllowedEmail('user@notpetairvalet.com')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('returns true for https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('returns true for http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('returns false for invalid string', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('hello! @world#')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims hyphens from edges', () => {
    expect(slugify('-hello world-')).toBe('hello-world');
  });

  it('handles underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });
});
