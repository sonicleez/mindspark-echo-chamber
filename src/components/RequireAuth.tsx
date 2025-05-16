
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useRive, Layout, Fit, Alignment } from 'rive-react';

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
  const { isAdmin, isLoading: isAdminLoading, refreshAdminStatus } = useAdminStatus(user?.id);
  
  // Check if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Refresh admin status when entering admin routes
  useEffect(() => {
    if (isAdminRoute && user?.id) {
      refreshAdminStatus();
    }
  }, [isAdminRoute, user?.id]); 

  // Initialize Rive animation
  const { RiveComponent } = useRive({
    src: 'https://public.rive.app/community/runtime-files/2424-4662-simple-loading-animation.riv',
    stateMachines: 'State Machine 1',
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    }),
    autoplay: true
  });

  if (loading || (isAdminRoute && isAdminLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24">
            <RiveComponent />
          </div>
          <p className="text-muted-foreground">
            {isAdminRoute ? 'Verifying admin privileges...' : 'Loading authentication...'}
          </p>
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
