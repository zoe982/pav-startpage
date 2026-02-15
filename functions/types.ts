export interface Env {
  readonly DB: D1Database;
  readonly ASSETS_BUCKET: R2Bucket;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly GOOGLE_REDIRECT_URI: string;
  readonly SESSION_SECRET: string;
  readonly ADMIN_EMAILS: string;
  readonly ALLOWED_EMAILS: string;
}

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
  readonly isAdmin: boolean;
}

export interface AuthenticatedData extends Record<string, unknown> {
  user: SessionUser;
}
