
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Shield } from 'lucide-react';
import { toast } from 'sonner';
import AdminBadge from './AdminBadge';

const AdminMenu = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!user?.id) {
      if (isMounted) {
        setIsLoading(false);
      }
      return;
    }
    
    // Use a small delay to ensure user object is fully loaded
    const timer = setTimeout(async () => {
      try {
        console.log('AdminMenu: Checking admin role for user:', user.id);
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');

        console.log('AdminMenu: Admin check response:', { data, error });
        
        if (error) {
          console.error('AdminMenu: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setIsAdmin(data && data.length > 0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AdminMenu: Error in admin role check:', error);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }, 1500); // Increasing delay to ensure user ID is properly available
    
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
