import { useAuth } from './useAuth.ts';
import type { AppKey } from '../types/auth.ts';

export function useAppAccess(): { readonly isInternal: boolean; readonly hasAccess: (appKey: AppKey) => boolean } {
  const { user } = useAuth();
  const isInternal = user?.isInternal ?? false;

  function hasAccess(appKey: AppKey): boolean {
    if (!user) return false;
    return isInternal || user.appGrants.includes(appKey);
  }

  return { isInternal, hasAccess };
}
