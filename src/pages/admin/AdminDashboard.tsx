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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/admin/links"
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Links
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add, edit, or remove quick-access links on the start page.
              </p>
            </Link>
            <Link
              to="/admin/wiki"
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Wiki
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create and edit wiki pages for company documentation.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
