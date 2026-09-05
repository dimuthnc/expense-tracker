import { useAuth0 } from '@auth0/auth0-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function Login() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo || '/';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-machine" aria-label="Checking session" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-10 sm:px-10">
      <main className="fx-shell fx-shell--narrow flex flex-1 flex-col justify-center py-16">
        <p className="fx-eyebrow">
          Personal finance
          <span className="fx-dot" aria-hidden="true" />
          Sign in
        </p>
        <h1 className="fx-display">
          Know where the month <em>actually</em> went.
        </h1>
        <p className="fx-lead mt-6">
          Card bills, installments, fixed costs and cash, totalled against one billing cycle.
          Nothing is stored online. Export a file when you are done.
        </p>
        <div className="fx-cluster mt-10">
          <Button size="lg" onClick={() => loginWithRedirect({ appState: { returnTo } })}>
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>
      </main>
      <footer className="fx-shell fx-shell--narrow">
        <div className="fx-statusbar">
          <span className="fx-pulse" aria-hidden="true" />
          <span>Personal Expense Manager</span>
          <span className="fx-statusbar__end">Data stays in your browser</span>
        </div>
      </footer>
    </div>
  );
}
