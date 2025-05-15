
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const fetchAdminStatus = async (userId: string) => {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.is_admin || false;
};

const RequireAdmin: React.FC = () => {
  const { user, loading } = useAuth();
  
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['adminStatus', user?.id],
    queryFn: () => fetchAdminStatus(user?.id || ''),
    enabled: !!user?.id,
  });
  
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mind-accent"></div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

export default RequireAdmin;
