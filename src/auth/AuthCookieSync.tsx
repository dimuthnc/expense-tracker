import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { clearAuthCookie, setAuthCookie } from '@/lib/authCookie';

// Mirrors the current access token into the edge-enforcement cookie so
// functions/_middleware.js can verify it before serving HTML.
export function AuthCookieSync() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      clearAuthCookie();
      return;
    }
    let cancelled = false;
    getAccessTokenSilently()
      .then((token) => {
        if (!cancelled) setAuthCookie(token);
      })
      .catch(() => {
        if (!cancelled) clearAuthCookie();
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return null;
}
