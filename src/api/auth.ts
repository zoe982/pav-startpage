import type { User } from '../types/auth.ts';
import { apiFetch } from './client.ts';

export async function fetchCurrentUser(): Promise<User> {
  return await apiFetch<User>('/api/auth/me');
}

export async function logout(): Promise<void> {
  await apiFetch<undefined>('/api/auth/logout', { method: 'POST' });
}
