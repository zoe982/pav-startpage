import type { JSX } from 'react';
import type { Link } from '../../types/link.ts';

export function LinkCard({ link }: { readonly link: Link }): JSX.Element {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {link.iconUrl ? (
          <img
            src={link.iconUrl}
            alt=""
            className="h-8 w-8 rounded"
            loading="lazy"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-sm font-bold text-blue-600">
            {link.title.charAt(0).toUpperCase()}
          </div>
        )}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
          {link.title}
        </h3>
      </div>
      {link.description && (
        <p className="text-sm text-gray-500">{link.description}</p>
      )}
    </a>
  );
}
