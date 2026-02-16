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
          <h1 className="text-2xl font-bold text-pav-blue">Admin Dashboard</h1>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/admin/links"
              className="state-layer rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]"
            >
              <h2 className="text-lg font-semibold text-pav-blue">
                Manage Links
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Add, edit, or remove quick-access links on the start page.
              </p>
            </Link>
            <Link
              to="/admin/wiki"
              className="state-layer rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]"
            >
              <h2 className="text-lg font-semibold text-pav-blue">
                Manage Wiki
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Create and edit wiki pages for company documentation.
              </p>
            </Link>
            <Link
              to="/admin/brand-rules"
              className="state-layer rounded-xl border border-pav-tan/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-elevation-1)] motion-standard hover:border-pav-gold hover:shadow-[var(--shadow-elevation-2)]"
            >
              <h2 className="text-lg font-semibold text-pav-blue">
                Brand Voice Rules
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Define brand guidelines used by the AI text rewriter.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
