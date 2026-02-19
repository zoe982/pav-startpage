import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { fetchGuests, addGuest, removeGrant } from '../../api/guests.ts';
import { fetchUsers, updateAdminStatus } from '../../api/users.ts';
import type { GuestGrant } from '../../api/guests.ts';
import type { AdminUser } from '../../api/users.ts';

type Tab = 'guests' | 'admins';
type GuestGrantGroup = [GuestGrant, ...GuestGrant[]];

const APP_OPTIONS = [
  { key: 'brand-voice', label: 'Brand Voice' },
  { key: 'templates', label: 'Templates' },
  { key: 'wiki', label: 'Wiki' },
] as const;

export function ManageAccessPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('guests');
  const [grants, setGrants] = useState<GuestGrant[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadGuests = useCallback(async () => {
    try {
      const data = await fetchGuests();
      setGrants(data);
    } catch {
      addToast('Failed to load guest grants', 'error');
    }
  }, [addToast]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      addToast('Failed to load users', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([loadGuests(), loadUsers()]).finally(() => {
      setIsLoading(false);
    });
  }, [loadGuests, loadUsers]);

  const handleAddGuest = async (): Promise<void> => {
    if (!newEmail.trim() || selectedApps.size === 0) return;
    setIsSubmitting(true);
    try {
      await addGuest(newEmail.trim(), [...selectedApps]);
      addToast('Guest added', 'success');
      setNewEmail('');
      setSelectedApps(new Set());
      await loadGuests();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add guest', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGrant = async (id: string): Promise<void> => {
    try {
      await removeGrant(id);
      addToast('Grant removed', 'success');
      await loadGuests();
    } catch {
      addToast('Failed to remove grant', 'error');
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean): Promise<void> => {
    try {
      await updateAdminStatus(userId, !currentIsAdmin);
      addToast(`Admin status ${currentIsAdmin ? 'removed' : 'granted'}`, 'success');
      await loadUsers();
    } catch {
      addToast('Failed to update admin status', 'error');
    }
  };

  const toggleApp = (appKey: string): void => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appKey)) {
        next.delete(appKey);
      } else {
        next.add(appKey);
      }
      return next;
    });
  };

  // Group grants by email
  const guestsByEmail = grants.reduce<Map<string, GuestGrantGroup>>((acc, grant) => {
    const list = acc.get(grant.email);
    if (list === undefined) {
      acc.set(grant.email, [grant]);
    } else {
      list.push(grant);
    }
    return acc;
  }, new Map());

  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-on-surface">User Access</h1>

          {/* Tab selector */}
          <div className="mt-4 flex gap-1 rounded-full bg-surface-container-high p-1 ring-1 ring-outline-variant w-fit">
            <button
              type="button"
              onClick={() => { setTab('guests'); }}
              className={`state-layer touch-target rounded-full px-6 py-2 text-xs font-semibold tracking-wide motion-standard ${
                tab === 'guests'
                  ? 'bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Guest Access
            </button>
            <button
              type="button"
              onClick={() => { setTab('admins'); }}
              className={`state-layer touch-target rounded-full px-6 py-2 text-xs font-semibold tracking-wide motion-standard ${
                tab === 'admins'
                  ? 'bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Admins
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-16 skeleton-shimmer rounded-lg" />
              ))}
            </div>
          ) : tab === 'guests' ? (
            <div className="mt-6 space-y-6">
              {/* Add guest form */}
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">Add Guest</h2>
                <div className="space-y-4">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); }}
                    placeholder="guest@example.com"
                    className="touch-target w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface motion-standard placeholder:text-outline focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  <fieldset>
                    <legend className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Apps</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {APP_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          data-testid={`app-option-${opt.key}`}
                          onClick={() => { toggleApp(opt.key); }}
                          className={`state-layer touch-target inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold motion-standard ${
                            selectedApps.has(opt.key)
                              ? 'border-secondary-container bg-secondary-container text-on-secondary-container shadow-[var(--shadow-elevation-1)]'
                              : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:bg-surface-container'
                          }`}
                        >
                          {selectedApps.has(opt.key) && (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    type="button"
                    data-testid="add-guest-submit"
                    onClick={() => { void handleAddGuest(); }}
                    disabled={isSubmitting || !newEmail.trim() || selectedApps.size === 0}
                    className="state-layer touch-target rounded-full bg-tertiary px-6 py-2 text-sm font-semibold text-on-primary motion-standard hover:bg-tertiary/85 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? 'Adding\u2026' : 'Add Guest'}
                  </button>
                </div>
              </div>

              {/* Guest list */}
              {guestsByEmail.size === 0 ? (
                <p className="text-sm text-on-surface-variant">No guest access grants yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...guestsByEmail.entries()].map(([email, emailGrants]) => {
                    const createdAt = new Date(emailGrants[0].createdAt).toLocaleDateString();
                    return (
                      <div
                        key={email}
                        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-primary">{email}</h3>
                          <span className="text-xs text-on-surface-variant">
                            Added {createdAt}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {emailGrants.map((grant) => (
                            <span
                              key={grant.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container"
                            >
                              {APP_OPTIONS.find((o) => o.key === grant.appKey)?.label ?? grant.appKey}
                              <button
                                type="button"
                                onClick={() => { void handleRemoveGrant(grant.id); }}
                                className="state-layer touch-target-icon rounded-full p-1 text-on-surface-variant motion-standard hover:bg-error-container hover:text-error"
                                aria-label={`Remove ${grant.appKey} access`}
                              >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No users found.</p>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {u.pictureUrl ? (
                        <img src={u.pictureUrl} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary text-sm font-semibold text-on-primary">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-primary">{u.name}</h3>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid={`admin-toggle-${u.id}`}
                      onClick={() => { void handleToggleAdmin(u.id, u.isAdmin); }}
                      className={`state-layer touch-target rounded-full px-4 py-2 text-xs font-semibold motion-standard ${
                        u.isAdmin
                          ? 'bg-tertiary text-on-primary hover:bg-tertiary/85'
                          : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {u.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
