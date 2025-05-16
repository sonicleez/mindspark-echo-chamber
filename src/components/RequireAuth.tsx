
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';

interface RequireAuthProps {
  redirectTo?: string;
  requireAdmin?: boolean;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ 
  redirectTo = '/auth',
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);
  
  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading || (isAdminRoute && !isAdminLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    // Save the attempted URL for redirecting back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If on admin route but not an admin, redirect to home
  if (isAdminRoute && !isAdmin && !isAdminLoading) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
