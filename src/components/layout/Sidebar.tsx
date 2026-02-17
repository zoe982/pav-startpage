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
    <aside className="w-64 border-r border-pav-tan/30 bg-surface-container-lowest p-4">
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
              className={`state-layer touch-target rounded-md px-3 py-2 text-sm font-medium motion-standard ${
                isActive
                  ? 'bg-pav-gold/20 text-pav-blue'
                  : 'text-pav-grey hover:bg-pav-cream/50'
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
