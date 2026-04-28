'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';
// import { useSubscription } from '@/hooks/useSubscription';

// TopBar component handles user profile display and navigation
export default function TopBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  // const { subscription, isLoading: isLoadingSubscription } = useSubscription();

  // Handle user logout
  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <div className="w-full bg-card/80 backdrop-blur border-b border-border p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
          Sistema de Auditoría
        </Link>

        <div className="flex items-center gap-4">
          {/* Subscription Button
          {!isLoadingSubscription && (
            !subscription || 
            subscription.status === 'canceled' || 
            (subscription.cancel_at_period_end && new Date(subscription.current_period_end) > new Date())
          ) && (
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Subscription
            </Button>
          )} */}
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold ring-1 ring-primary/15">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-foreground">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 