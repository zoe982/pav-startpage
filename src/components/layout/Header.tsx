import type { JSX } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';
import { useAppAccess } from '../../hooks/useAppAccess.ts';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.ts';

function UserAvatar({ name, pictureUrl }: { readonly name: string; readonly pictureUrl?: string | null }): JSX.Element {
  const [failed, setFailed] = useState(false);
  if (pictureUrl && !failed) {
    return (
      <img
        src={pictureUrl}
        alt=""
        className="h-8 w-8 rounded-full"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => {
          setFailed(true);
        }}
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pav-terra text-sm font-semibold text-on-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Header(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasAccess } = useAppAccess();
  const isOnline = useOnlineStatus();

  return (
    <header className="border-b border-pav-tan/30 bg-pav-cream">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="state-layer touch-target flex items-center gap-3 rounded-lg text-pav-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pav-blue focus-visible:ring-offset-2">
            <img src="/pav_logo_clean_flat_2048.webp" alt="" className="h-10 w-10" />
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-bold">Pet Air Valet</span>
              <span className="font-serif text-xs italic text-on-surface-variant">Fly Together, In-Cabin</span>
            </div>
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-6 sm:flex">
              <Link
                to="/"
                className="state-layer touch-target inline-flex items-center rounded-md px-2 py-2 text-sm font-medium text-on-surface motion-standard hover:text-pav-blue"
              >
                Home
              </Link>
              {hasAccess('wiki') && (
                <Link
                  to="/wiki"
                  className="state-layer touch-target inline-flex items-center rounded-md px-2 py-2 text-sm font-medium text-on-surface motion-standard hover:text-pav-blue"
                >
                  Wiki
                </Link>
              )}
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="state-layer touch-target inline-flex items-center rounded-md px-2 py-2 text-sm font-medium text-pav-terra motion-standard hover:text-pav-terra-hover"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserAvatar name={user.name} pictureUrl={user.pictureUrl} />
              <span className="hidden text-sm text-on-surface sm:block">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="state-layer touch-target rounded-md px-3 py-2 text-sm text-on-surface-variant motion-standard hover:bg-pav-tan/20 hover:text-pav-blue"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      {!isOnline && (
        <div className="border-t border-outline-variant bg-error-container/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-error-container">
              <span className="h-2 w-2 rounded-full bg-error" aria-hidden="true" />
              Offline. Some actions require a connection.
            </div>
            <button
              type="button"
              onClick={() => { window.location.reload(); }}
              className="state-layer touch-target rounded-full px-3 py-1 text-xs font-semibold text-on-error-container motion-standard hover:bg-error/10"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
