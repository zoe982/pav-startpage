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
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="url"
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="iconUrl"
          className="block text-sm font-medium text-gray-700"
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-gray-700"
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="isVisible" className="text-sm text-gray-700">
            Visible
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
