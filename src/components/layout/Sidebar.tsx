import type { JSX } from 'react';
import { Link, useLocation } from 'react-router';

const adminLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/links', label: 'Manage Links' },
  { to: '/admin/wiki', label: 'Manage Wiki' },
  { to: '/admin/brand-rules', label: 'Brand Voice Rules' },
] as const;

export function Sidebar(): JSX.Element {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-pav-tan/30 bg-white p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-pav-grey/60">
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
