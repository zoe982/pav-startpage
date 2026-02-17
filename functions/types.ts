export interface Env {
  readonly DB: D1Database;
  readonly ASSETS_BUCKET: R2Bucket;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly GOOGLE_REDIRECT_URI: string;
  readonly SESSION_SECRET: string;
  readonly ADMIN_EMAILS: string;
  readonly ALLOWED_EMAILS: string;
  readonly CF_AI_GATEWAY_TOKEN: string;
  readonly AI_GATEWAY_ENDPOINT: string;
}

export const INTERNAL_DOMAINS = ['petairvalet.com', 'marsico.org'] as const;

export type AppKey = 'brand-voice' | 'templates' | 'wiki';

export function isInternalUser(email: string): boolean {
  const lower = email.toLowerCase();
  return INTERNAL_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

export function assertAppAccess(user: SessionUser, appKey: AppKey): Response | null {
  if (user.isInternal) return null;
  if (user.appGrants.includes(appKey)) return null;
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
  readonly isAdmin: boolean;
  readonly isInternal: boolean;
  readonly appGrants: AppKey[];
}

export interface AuthenticatedData extends Record<string, unknown> {
  user: SessionUser;
}
