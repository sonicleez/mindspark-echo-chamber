
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Home
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset
} from "@/components/ui/sidebar";

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        console.log('AdminLayout: Checking admin role for user:', user.id);
        
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin');
        
        console.log('AdminLayout: Admin role check result:', { data, error });
        
        if (error) {
          console.error('AdminLayout: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          const isUserAdmin = data && data.length > 0;
          setIsAdmin(isUserAdmin);
          setIsLoading(false);
          
          // If not admin, redirect to home
          if (!isUserAdmin) {
            toast.error("You don't have permission to access the admin area");
            navigate('/');
          }
        }
      } catch (error) {
        console.error('AdminLayout: Error in admin role check:', error);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
          navigate('/');
        }
      }
    };
    
    // Add a delay to ensure user object is fully loaded
    const timer = setTimeout(() => {
      checkAdminRole();
    }, 800);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?.id, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isAdmin === false) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center p-2">
              <LayoutDashboard className="h-6 w-6 mr-2 text-primary" />
              <span className="text-lg font-semibold">Admin Panel</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" asChild>
                  <Link to="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Users" asChild>
                  <Link to="/admin/users">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Configs" asChild>
                  <Link to="/admin">
                    <Settings className="h-4 w-4" />
                    <span>Configurations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Logs" asChild>
                  <Link to="/admin">
                    <FileText className="h-4 w-4" />
                    <span>Usage Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Return Home" asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>Back to App</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="container mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <SidebarTrigger />
            </div>
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
