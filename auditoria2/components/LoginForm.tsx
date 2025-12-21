'use client';

import { useState } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Mail, Lock, KeyRound } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function LoginForm({ 
  onSubmit, 
  onGoogleSignIn, 
  isLoading, 
  error 
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password, isSignUp);
  };

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-card border border-border rounded-lg shadow-lg">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isSignUp ? 'Get started with your account' : 'Welcome back! Please sign in to continue'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-sm px-0"
          >
            Forgot your password?
          </Button>
        </div>

        <ForgotPasswordModal 
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />

        <Button 
          type="submit" 
          disabled={isLoading || !email || !password}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader size={16} variant="default" />
              {isSignUp ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            <>
              {isSignUp ? 'Sign up' : 'Sign in'} with Email
            </>
          )}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}