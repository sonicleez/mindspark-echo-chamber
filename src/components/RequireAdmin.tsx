
import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const fetchAdminStatus = async (userId: string) => {
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.is_admin || false;
  } catch (error) {
    console.error('Error fetching admin status:', error);
    throw error;
  }
};

const RequireAdmin: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { 
    data: isAdmin, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: () => fetchAdminStatus(user?.id || ''),
    enabled: !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    if (error) {
      toast.error('Failed to verify admin permissions. Please try again.');
      console.error('Admin verification error:', error);
    }
  }, [error]);
  
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" className="border-mind-accent" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl font-medium">Authorization Error</div>
        <p className="text-muted-foreground">Unable to verify admin permissions</p>
        <button 
          onClick={() => navigate('/')} 
          className="text-primary hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

export default RequireAdmin;
