export type AppKey = 'brand-voice' | 'templates' | 'wiki';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
  readonly isAdmin: boolean;
  readonly isInternal: boolean;
  readonly appGrants: AppKey[];
}

export interface AuthState {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
}
