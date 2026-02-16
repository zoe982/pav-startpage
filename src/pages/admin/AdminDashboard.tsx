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
              className="rounded-xl border border-pav-tan/30 bg-white p-6 shadow-sm transition hover:border-pav-gold hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-pav-blue">
                Manage Links
              </h2>
              <p className="mt-1 text-sm text-pav-grey/60">
                Add, edit, or remove quick-access links on the start page.
              </p>
            </Link>
            <Link
              to="/admin/wiki"
              className="rounded-xl border border-pav-tan/30 bg-white p-6 shadow-sm transition hover:border-pav-gold hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-pav-blue">
                Manage Wiki
              </h2>
              <p className="mt-1 text-sm text-pav-grey/60">
                Create and edit wiki pages for company documentation.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
