import { apiFetch } from './client.ts';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
  readonly isAdmin: boolean;
}

export async function fetchUsers(): Promise<AdminUser[]> {
  return await apiFetch<AdminUser[]>('/api/admin/users');
}

export async function updateAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  await apiFetch<{ success: boolean }>('/api/admin/users', {
    method: 'PUT',
    body: JSON.stringify({ userId, isAdmin }),
  });
}
