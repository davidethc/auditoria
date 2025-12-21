'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  SideSheet,
  SideSheetContent,
  SideSheetHeader,
  SideSheetTitle,
  SideSheetDescription,
  SideSheetFooter,
  SideSheetClose,
} from '@/components/ui/side-sheet';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { toast } from '@/components/ui/toast';
import { CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password#`,
      });
      if (error) throw error;
      setSuccess(true);
      toast.success('Reset link sent!', {
        description: 'Please check your email inbox.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <SideSheet open={isOpen} onOpenChange={handleClose} side="right" width="420px">
      <SideSheetContent>
        <SideSheetHeader>
          <SideSheetTitle>Reset Password</SideSheetTitle>
          <SideSheetDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </SideSheetDescription>
        </SideSheetHeader>

        {success ? (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Email Sent!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Reset link has been sent to your email address. Please check your inbox.
                </p>
              </div>
            </div>
            <SideSheetFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </SideSheetFooter>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleResetPassword();
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <SideSheetFooter>
              <SideSheetClose asChild>
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
              </SideSheetClose>
              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !email}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader size={16} variant="default" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </SideSheetFooter>
          </div>
        )}
      </SideSheetContent>
    </SideSheet>
  );
} 