import { describe, it, expect } from 'vitest';
import {
  SESSION_COOKIE_NAME,
  ALLOWED_DOMAINS,
  SESSION_EXPIRY_DAYS,
} from '../../src/utils/constants.ts';

describe('constants', () => {
  it('exports SESSION_COOKIE_NAME', () => {
    expect(SESSION_COOKIE_NAME).toBe('__session');
  });

  it('exports ALLOWED_DOMAINS', () => {
    expect(ALLOWED_DOMAINS).toEqual(['petairvalet.com', 'marsico.org']);
  });

  it('exports SESSION_EXPIRY_DAYS', () => {
    expect(SESSION_EXPIRY_DAYS).toBe(7);
  });
});
