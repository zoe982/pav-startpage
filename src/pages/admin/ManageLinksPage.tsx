import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';
import { LinkForm } from '../../components/links/LinkForm.tsx';
import { useToast } from '../../hooks/useToast.ts';
import type { Link } from '../../types/link.ts';
import type { LinkFormData } from '../../types/link.ts';
import {
  fetchAdminLinks,
  createLink,
  updateLink,
  deleteLink,
} from '../../api/links.ts';

export function ManageLinksPage(): JSX.Element {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminLinks();
      setLinks(data);
    } catch {
      addToast('Failed to load links', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const handleCreate = async (data: LinkFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await createLink(data);
      addToast('Link created', 'success');
      setShowForm(false);
      await loadLinks();
    } catch {
      addToast('Failed to create link', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: LinkFormData): Promise<void> => {
    if (!editingLink) return;
    setIsSubmitting(true);
    try {
      await updateLink(editingLink.id, data);
      addToast('Link updated', 'success');
      setEditingLink(null);
      await loadLinks();
    } catch {
      addToast('Failed to update link', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      await deleteLink(id);
      addToast('Link deleted', 'success');
      await loadLinks();
    } catch {
      addToast('Failed to delete link', 'error');
    }
  };

  const initialData = editingLink
    ? {
        title: editingLink.title,
        url: editingLink.url,
        description: editingLink.description ?? '',
        iconUrl: editingLink.iconUrl ?? '',
        sortOrder: editingLink.sortOrder,
        isVisible: editingLink.isVisible,
      }
    : null;

  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-pav-blue">Manage Links</h1>
            {!showForm && !editingLink && (
              <button
                onClick={() => { setShowForm(true); }}
                className="state-layer touch-target rounded-md bg-pav-terra px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-pav-terra-hover"
              >
                Add Link
              </button>
            )}
          </div>

          {(showForm || editingLink) && (
            <div className="mt-6 rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-6">
              <h2 className="mb-4 text-lg font-semibold text-pav-blue">
                {editingLink ? 'Edit Link' : 'New Link'}
              </h2>
              <LinkForm
                {...(initialData ? { initialData } : {})}
                onSubmit={editingLink ? handleUpdate : handleCreate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingLink(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="h-16 skeleton-shimmer rounded-lg"
                  />
                ))}
              </div>
            ) : links.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No links yet. Add one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between rounded-lg border border-pav-tan/30 bg-surface-container-lowest px-4 py-3"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-pav-blue">
                        {link.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!link.isVisible && (
                        <span className="rounded bg-pav-gold/20 px-2 py-0.5 text-xs text-pav-blue">
                          Hidden
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingLink(link);
                          setShowForm(false);
                        }}
                        className="state-layer touch-target rounded px-3 py-2 text-xs text-pav-blue motion-standard hover:bg-pav-gold/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(link.id)}
                        className="state-layer touch-target rounded px-3 py-2 text-xs text-error motion-standard hover:bg-error-container"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
