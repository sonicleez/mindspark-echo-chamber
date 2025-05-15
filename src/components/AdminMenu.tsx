
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import AdminBadge from './AdminBadge';

// Cache to store admin status checks
const adminStatusCache = new Map<string, {isAdmin: boolean, timestamp: number}>();
// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000; 

const AdminMenu = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        console.log('AdminMenu: Checking admin role for user:', user.id);
        
        // Check cache first
        const now = Date.now();
        const cachedStatus = adminStatusCache.get(user.id);
        
        if (cachedStatus && (now - cachedStatus.timestamp < CACHE_EXPIRY)) {
          console.log('AdminMenu: Using cached admin status');
          if (isMounted) {
            setIsAdmin(cachedStatus.isAdmin);
            setIsLoading(false);
          }
          return;
        }
        
        // Call the security definer function directly through RPC
        const { data, error } = await supabase.rpc('check_if_user_is_admin', {
          user_id: user.id
        });
        
        console.log('AdminMenu: Admin check response:', { data, error });
        
        if (error) {
          console.error('AdminMenu: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        
        // Update cache
        adminStatusCache.set(user.id, {
          isAdmin: Boolean(data),
          timestamp: now
        });
        
        if (isMounted) {
          setIsAdmin(Boolean(data));
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AdminMenu: Error in admin role check:', error);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };
    
    // Add a small delay to ensure user object is fully loaded
    const timer = setTimeout(() => {
      checkAdminRole();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <Button 
        variant="outline"
        className="flex items-center gap-1 bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-300"
        disabled
      >
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
          <span>Loading...</span>
        </div>
      </Button>
    ); 
  }
  
  if (!isAdmin) {
    return null;
  }

  return (
    <Button 
      variant="outline"
      className="flex items-center gap-1 bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300"
      asChild
    >
      <Link to="/admin">
        <div className="flex items-center">
          <AdminBadge />
          <Shield className="mr-1 h-4 w-4" />
          <span>Admin Dashboard</span>
        </div>
      </Link>
    </Button>
  );
};

export default AdminMenu;
