import { apiFetch } from './client.ts';

export interface GuestGrant {
  readonly id: string;
  readonly email: string;
  readonly appKey: string;
  readonly grantedBy: string;
  readonly grantedByName: string;
  readonly createdAt: string;
}

export async function fetchGuests(): Promise<GuestGrant[]> {
  return await apiFetch<GuestGrant[]>('/api/admin/guests');
}

export async function addGuest(email: string, appKeys: string[]): Promise<void> {
  await apiFetch<{ success: boolean }>('/api/admin/guests', {
    method: 'POST',
    body: JSON.stringify({ email, appKeys }),
  });
}

export async function removeGrant(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/admin/guests/${id}`, { method: 'DELETE' });
}
