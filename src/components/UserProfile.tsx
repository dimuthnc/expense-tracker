import { useAuth0 } from '@auth0/auth0-react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { clearAuthCookie } from '@/lib/authCookie';

export function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth0();

  if (!isAuthenticated || !user) return null;

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  const handleLogout = () => {
    clearAuthCookie();
    logout({ logoutParams: { returnTo: `${window.location.origin}/login` } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 px-2" title="Account">
          {user.picture ? (
            <img
              src={user.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="h-6 w-6 rounded-pill border border-rule-strong"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-pill border border-human-edge bg-human-wash font-mono text-micro font-bold text-human">
              {initial}
            </span>
          )}
          <span className="hidden max-w-[10rem] truncate text-small sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate text-small font-medium text-ink">{user.name}</div>
          <div className="truncate text-micro text-ink-dim">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="h-3.5 w-3.5 text-ink-dim" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
