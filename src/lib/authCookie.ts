// Cookie consumed by functions/_middleware.js for edge enforcement.
// Not HttpOnly by design: the SPA owns the token and must be able to set/clear it.
const COOKIE_NAME = 'expense_auth';
const MAX_AGE_SECONDS = 60 * 60 * 24; // matches the 24 h session policy

export function setAuthCookie(accessToken: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${accessToken}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Strict${secure}`;
}

export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Strict`;
}
