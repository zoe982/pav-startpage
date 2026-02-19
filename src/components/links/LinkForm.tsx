import type { JSX } from 'react';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { LinkFormData } from '../../types/link.ts';

interface LinkFormProps {
  readonly initialData?: LinkFormData;
  readonly onSubmit: (data: LinkFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
}

const defaultData: LinkFormData = {
  title: '',
  url: '',
  description: '',
  iconUrl: '',
  sortOrder: 0,
  isVisible: true,
};

export function LinkForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: LinkFormProps): JSX.Element {
  const [formData, setFormData] = useState<LinkFormData>(
    initialData ?? defaultData,
  );

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    void onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-on-surface-variant"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, title: e.target.value }));
          }}
          className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-on-surface-variant"
        >
          URL
        </label>
        <input
          id="url"
          type="url"
          required
          value={formData.url}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, url: e.target.value }));
          }}
          className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-on-surface-variant"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, description: e.target.value }));
          }}
          rows={2}
          className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="iconUrl"
          className="block text-sm font-medium text-on-surface-variant"
        >
          Icon URL
        </label>
        <input
          id="iconUrl"
          type="url"
          value={formData.iconUrl}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, iconUrl: e.target.value }));
          }}
          className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-on-surface-variant"
          >
            Sort Order
          </label>
          <input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                sortOrder: parseInt(e.target.value, 10) || 0,
              }));
            }}
            className="touch-target mt-1 block w-full rounded-xl border border-outline-variant px-4 py-2 text-sm focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
          />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input
            id="isVisible"
            type="checkbox"
            checked={formData.isVisible}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, isVisible: e.target.checked }));
            }}
            className="touch-target-icon h-4 w-4 rounded border-outline-variant text-primary"
          />
          <label htmlFor="isVisible" className="text-sm text-on-surface-variant">
            Visible
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
