import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Auth0Provider handles the code exchange; on success onRedirectCallback
// navigates to the original path, so this page only shows progress/errors.
export function Callback() {
  const { error } = useAuth0();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="fx-panel fx-panel--signal w-full max-w-md">
          <div className="fx-panel__head">
            <span className="fx-panel__label">Sign-in failed</span>
          </div>
          <p className="fx-panel__body text-body">{error.message}</p>
          <div className="fx-cluster mt-5">
            <Button variant="outline" asChild>
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-machine" aria-label="Completing login" />
    </div>
  );
}
