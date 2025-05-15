
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from 'lucide-react';
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
    }, 800); // Longer delay to ensure user ID is available
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?.id]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }
  
  if (!isAdmin) {
    return null; // Don't show for non-admin users
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
          <span>Admin Dashboard</span>
        </div>
      </Link>
    </Button>
  );
};

export default AdminMenu;
