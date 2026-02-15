import type { JSX } from 'react';
import { Link, useLocation } from 'react-router';

const adminLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/links', label: 'Manage Links' },
  { to: '/admin/wiki', label: 'Manage Wiki' },
] as const;

export function Sidebar(): JSX.Element {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Admin Panel
      </h2>
      <nav className="flex flex-col gap-1">
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
