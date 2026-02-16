/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cloudflare Workers mock helpers for testing PagesFunction handlers.
 */

export interface MockD1Result {
  results: any[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface MockD1PreparedStatement {
  bind: (...values: any[]) => MockD1PreparedStatement;
  first: <T = any>(column?: string) => Promise<T | null>;
  all: <T = any>() => Promise<{ results: T[] }>;
  run: () => Promise<MockD1Result>;
}

export function createMockD1(
  responses: Map<string, any> = new Map(),
): any {
  const db = {
    prepare: vi.fn((query: string) => {
      const stmt: MockD1PreparedStatement = {
        bind: vi.fn((..._values: any[]) => stmt),
        first: vi.fn(async () => responses.get(query) ?? null),
        all: vi.fn(async () => ({
          results: responses.get(query) ?? [],
        })),
        run: vi.fn(async () => ({
          results: [],
          success: true,
          meta: {},
        })),
      };
      return stmt;
    }),
  };
  return db;
}

export function createMockR2(): any {
  return {
    put: vi.fn(async () => ({})),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => undefined),
  };
}

export interface MockContextOptions {
  request?: Request;
  env?: Record<string, any>;
  params?: Record<string, string>;
  data?: Record<string, any>;
  next?: () => Promise<Response>;
}

export function createMockContext(options: MockContextOptions = {}): any {
  const defaultEnv = {
    DB: createMockD1(),
    ASSETS_BUCKET: createMockR2(),
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:8788/api/auth/google-callback',
    SESSION_SECRET: 'test-session-secret',
    ADMIN_EMAILS: 'admin@petairvalet.com',
    ALLOWED_EMAILS: 'external@example.com',
  };

  return {
    request: options.request ?? new Request('http://localhost:8788/'),
    env: { ...defaultEnv, ...options.env },
    params: options.params ?? {},
    data: options.data ?? {},
    next: options.next ?? vi.fn(async () => new Response('next')),
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    functionPath: '',
  };
}
