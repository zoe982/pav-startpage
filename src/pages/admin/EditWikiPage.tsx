import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';
import { MarkdownEditor } from '../../components/wiki/MarkdownEditor.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { slugify } from '../../utils/validation.ts';
import type { WikiFormData } from '../../types/wiki.ts';
import {
  fetchAdminWikiPage,
  createWikiPage,
  updateWikiPage,
} from '../../api/wiki.ts';

export function EditWikiPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const isEditing = slug !== undefined;
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState<WikiFormData>({
    title: '',
    slug: '',
    content: '',
    isPublished: false,
    showOnStart: false,
    sortOrder: 0,
  });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  const loadPage = useCallback(async () => {
    if (!slug) return;
    try {
      const page = await fetchAdminWikiPage(slug);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished,
        showOnStart: page.showOnStart,
        sortOrder: page.sortOrder,
      });
    } catch {
      addToast('Failed to load page', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [slug, addToast]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const handleTitleChange = (title: string): void => {
    setFormData((prev) => ({
      ...prev,
      title,
      ...(autoSlug ? { slug: slugify(title) } : {}),
    }));
  };

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && slug) {
        await updateWikiPage(slug, formData);
        addToast('Page updated', 'success');
      } else {
        await createWikiPage(formData);
        addToast('Page created', 'success');
      }
      void navigate('/admin/wiki');
    } catch {
      addToast('Failed to save page', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="h-8 w-48 animate-pulse rounded bg-surface-container" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-display text-primary">
            {isEditing ? 'Edit Page' : 'New Page'}
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="wiki-title"
                className="block text-sm font-medium text-on-surface-variant"
              >
                Title
              </label>
              <input
                id="wiki-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => { handleTitleChange(e.target.value); }}
                className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="wiki-slug"
                className="block text-sm font-medium text-on-surface-variant"
              >
                Slug
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="wiki-slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setFormData((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant">
                Content
              </label>
              <div className="mt-1">
                <MarkdownEditor
                  value={formData.content}
                  onChange={(content) => {
                    setFormData((prev) => ({ ...prev, content }));
                  }}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }));
                  }}
                  className="touch-target-icon h-4 w-4 rounded border-outline-variant text-primary"
                />
                <label htmlFor="isPublished" className="text-sm text-on-surface-variant">
                  Published
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="showOnStart"
                  type="checkbox"
                  checked={formData.showOnStart}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      showOnStart: e.target.checked,
                    }));
                  }}
                  className="touch-target-icon h-4 w-4 rounded border-outline-variant text-primary"
                />
                <label htmlFor="showOnStart" className="text-sm text-on-surface-variant">
                  Pin to start page
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="wiki-sortOrder"
                  className="text-sm text-on-surface-variant"
                >
                  Sort order
                </label>
                <input
                  id="wiki-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value, 10) || 0,
                    }));
                  }}
                  className="touch-target w-24 rounded-xl border border-outline-variant px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => void navigate('/admin/wiki')}
                className="state-layer touch-target rounded-md border border-outline-variant px-4 py-2 text-sm text-on-surface-variant motion-standard hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="state-layer touch-target rounded-md bg-tertiary px-4 py-2 text-sm font-medium text-on-primary motion-standard hover:bg-tertiary/85 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
