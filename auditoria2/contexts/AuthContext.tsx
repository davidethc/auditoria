'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { 
  Session, 
  User, 
  SupabaseClient
} from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ 
    data: { user: User | null } | null; 
    error: Error | null;
  }>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    // Listen for auth changes - use setTimeout to avoid deadlock bug (#762)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    isLoading,
    supabase,
    signInWithGoogle: async () => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;

      if (authData?.session) {
        setSession(authData.session);
        setUser(authData.user ?? null);
      }

      await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id,
          email: authData.user?.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    },
    signOut: async () => {
      if (!isSupabaseConfigured) {
        setUser(null);
        setSession(null);
        window.location.href = '/login';
        return;
      }

      try {
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no session, clear state and redirect
          setUser(null);
          setSession(null);
          window.location.href = '/login';
          return;
        }

        // If we have a session, attempt to sign out
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, clear the local state and redirect
        setUser(null);
        setSession(null);
        window.location.href = '/login';
      }
    },
    signUpWithEmail: async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return { data, error };
    },
    updatePassword: async (newPassword: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase no está configurado');
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });
      if (error) throw error;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 