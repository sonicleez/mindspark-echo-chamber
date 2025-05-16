import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAdminStatusCache } from '@/hooks/useAdminStatus';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isLoggedIn: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log('Auth state changed:', event, currentSession?.user?.id);
            
            // Clear admin status cache on auth state change
            if (event === 'SIGNED_IN') {
              clearAdminStatusCache();
            } else if (event === 'SIGNED_OUT') {
              clearAdminStatusCache();
            }
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
          }
        );

        // Check for existing session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth:', error);
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signOut = async () => {
    try {
      // Clear cache before signing out
      if (user?.id) {
        clearAdminStatusCache(user.id);
      }
      
      await supabase.auth.signOut();
      
      // We don't need to update state here since onAuthStateChange will handle it
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
