
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Shared admin status cache to minimize API calls
const adminStatusCache = new Map<string, {isAdmin: boolean, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useAdminStatus = (userId?: string) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!userId) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        // Check cache first
        const now = Date.now();
        const cachedStatus = adminStatusCache.get(userId);
        
        if (cachedStatus && (now - cachedStatus.timestamp < CACHE_EXPIRY)) {
          console.log('useAdminStatus: Using cached admin status');
          if (isMounted) {
            setIsAdmin(cachedStatus.isAdmin);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('useAdminStatus: Checking admin role for user:', userId);
        
        // Call the NEW security definer function that avoids recursion
        const { data, error } = await supabase.rpc('check_if_user_is_admin_secure', {
          user_id: userId
        });
        
        console.log('useAdminStatus: Admin check response:', { data, error });
        
        if (error) {
          console.error('useAdminStatus: Error checking admin role:', error);
          if (isMounted) {
            setError(new Error(error.message));
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        
        // Update cache
        adminStatusCache.set(userId, {
          isAdmin: Boolean(data),
          timestamp: now
        });
        
        if (isMounted) {
          setIsAdmin(Boolean(data));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('useAdminStatus: Unexpected error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error checking admin status'));
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };
    
    checkAdminRole();
    
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { isAdmin, isLoading, error };
};

// Function to clear the admin status cache (useful for testing or after role changes)
export const clearAdminStatusCache = (userId?: string) => {
  if (userId) {
    adminStatusCache.delete(userId);
  } else {
    adminStatusCache.clear();
  }
};
