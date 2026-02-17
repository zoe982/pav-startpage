import type { JSX } from 'react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthGuard } from './components/auth/AuthGuard.tsx';
import { AdminGuard } from './components/auth/AdminGuard.tsx';
import { AppAccessGuard } from './components/auth/AppAccessGuard.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx';
import { ToastContainer } from './components/layout/ToastContainer.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { StartPage } from './pages/StartPage.tsx';
import { WikiListPage } from './pages/WikiListPage.tsx';
import { WikiViewPage } from './pages/WikiViewPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

const AdminDashboard = lazy(async () =>
  import('./pages/admin/AdminDashboard.tsx').then((m) => ({
    default: m.AdminDashboard,
  })),
);
const ManageLinksPage = lazy(async () =>
  import('./pages/admin/ManageLinksPage.tsx').then((m) => ({
    default: m.ManageLinksPage,
  })),
);
const ManageWikiPage = lazy(async () =>
  import('./pages/admin/ManageWikiPage.tsx').then((m) => ({
    default: m.ManageWikiPage,
  })),
);
const EditWikiPage = lazy(async () =>
  import('./pages/admin/EditWikiPage.tsx').then((m) => ({
    default: m.EditWikiPage,
  })),
);
const BrandVoicePage = lazy(async () =>
  import('./pages/BrandVoicePage.tsx').then((m) => ({
    default: m.BrandVoicePage,
  })),
);
const ManageBrandRulesPage = lazy(async () =>
  import('./pages/admin/ManageBrandRulesPage.tsx').then((m) => ({
    default: m.ManageBrandRulesPage,
  })),
);
const TemplatesPage = lazy(async () =>
  import('./pages/TemplatesPage.tsx').then((m) => ({
    default: m.TemplatesPage,
  })),
);
const TemplateEditPage = lazy(async () =>
  import('./pages/TemplateEditPage.tsx').then((m) => ({
    default: m.TemplateEditPage,
  })),
);
const ManageAccessPage = lazy(async () =>
  import('./pages/admin/ManageAccessPage.tsx').then((m) => ({
    default: m.ManageAccessPage,
  })),
);

function AdminFallback(): JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-pav-blue border-t-transparent" />
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <StartPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/wiki"
                element={
                  <AppAccessGuard appKey="wiki">
                    <WikiListPage />
                  </AppAccessGuard>
                }
              />
              <Route
                path="/wiki/:slug"
                element={
                  <AppAccessGuard appKey="wiki">
                    <WikiViewPage />
                  </AppAccessGuard>
                }
              />
              <Route
                path="/brand-voice"
                element={
                  <AppAccessGuard appKey="brand-voice">
                    <Suspense fallback={<AdminFallback />}>
                      <BrandVoicePage />
                    </Suspense>
                  </AppAccessGuard>
                }
              />
              <Route
                path="/templates"
                element={
                  <AppAccessGuard appKey="templates">
                    <Suspense fallback={<AdminFallback />}>
                      <TemplatesPage />
                    </Suspense>
                  </AppAccessGuard>
                }
              />
              <Route
                path="/templates/new"
                element={
                  <AppAccessGuard appKey="templates">
                    <Suspense fallback={<AdminFallback />}>
                      <TemplateEditPage />
                    </Suspense>
                  </AppAccessGuard>
                }
              />
              <Route
                path="/templates/:id"
                element={
                  <AppAccessGuard appKey="templates">
                    <Suspense fallback={<AdminFallback />}>
                      <TemplateEditPage />
                    </Suspense>
                  </AppAccessGuard>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/links"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <ManageLinksPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/wiki"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <ManageWikiPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/wiki/new"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <EditWikiPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/wiki/:slug/edit"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <EditWikiPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/brand-rules"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <ManageBrandRulesPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/access"
                element={
                  <AdminGuard>
                    <Suspense fallback={<AdminFallback />}>
                      <ManageAccessPage />
                    </Suspense>
                  </AdminGuard>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
