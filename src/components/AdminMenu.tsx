
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Shield } from 'lucide-react';
import AdminBadge from './AdminBadge';
import { useAdminStatus } from '@/hooks/useAdminStatus';

const AdminMenu = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdminStatus(user?.id);

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
