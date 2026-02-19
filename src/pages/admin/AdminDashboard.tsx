import type { JSX } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell.tsx';
import { Sidebar } from '../../components/layout/Sidebar.tsx';

export function AdminDashboard(): JSX.Element {
  return (
    <AppShell>
      <div className="flex gap-8">
        <Sidebar />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-on-surface">Admin Dashboard</h1>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/admin/links"
              className="state-layer glass-card glass-card-interactive p-6 motion-standard"
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Manage Links
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add, edit, or remove quick-access links on the start page.
              </p>
            </Link>
            <Link
              to="/admin/wiki"
              className="state-layer glass-card glass-card-interactive p-6 motion-standard"
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Manage Wiki
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Create and edit wiki pages for company documentation.
              </p>
            </Link>
            <Link
              to="/admin/brand-rules"
              className="state-layer glass-card glass-card-interactive p-6 motion-standard"
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Brand Voice Rules
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Define brand guidelines used by the AI text rewriter.
              </p>
            </Link>
            <Link
              to="/admin/access"
              className="state-layer glass-card glass-card-interactive p-6 motion-standard"
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                User Access
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Manage guest access and admin privileges.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
