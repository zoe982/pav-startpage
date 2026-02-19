import type { JSX } from 'react';
import { Link, useLocation } from 'react-router';

const adminLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/links', label: 'Manage Links' },
  { to: '/admin/wiki', label: 'Manage Wiki' },
  { to: '/admin/brand-rules', label: 'Brand Voice Rules' },
  { to: '/admin/access', label: 'User Access' },
] as const;

export function Sidebar(): JSX.Element {
  const location = useLocation();

  return (
    <aside className="w-64 bg-surface-container-low p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        Admin Panel
      </h2>
      <nav className="flex flex-col gap-1">
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`state-layer touch-target rounded-xl px-3 py-2 text-sm font-medium motion-standard ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container'
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
