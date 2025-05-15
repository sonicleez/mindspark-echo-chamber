
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

// Reuse the same admin status cache as AdminMenu
// This would normally be in a shared file, but for simplicity we're duplicating the declaration
const adminStatusCache = new Map<string, {isAdmin: boolean, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

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
          navigate('/');
        }
        return;
      }
      
      try {
        console.log('AdminLayout: Checking admin role for user:', user.id);
        
        // Check cache first
        const now = Date.now();
        const cachedStatus = adminStatusCache.get(user.id);
        
        if (cachedStatus && (now - cachedStatus.timestamp < CACHE_EXPIRY)) {
          console.log('AdminLayout: Using cached admin status');
          if (isMounted) {
            setIsAdmin(cachedStatus.isAdmin);
            setIsLoading(false);
            
            if (!cachedStatus.isAdmin) {
              toast.error("You don't have permission to access the admin area");
              navigate('/');
            }
          }
          return;
        }
        
        // Call the security definer function directly through RPC
        const { data, error } = await supabase.rpc('check_if_user_is_admin', {
          user_id: user.id
        });
        
        console.log('AdminLayout: Admin role check result:', { data, error });
        
        if (error) {
          console.error('AdminLayout: Error checking admin role:', error);
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
            toast.error("Error checking permissions");
            navigate('/');
          }
          return;
        }
        
        const isUserAdmin = Boolean(data);
        
        // Update cache
        adminStatusCache.set(user.id, {
          isAdmin: isUserAdmin,
          timestamp: now
        });
        
        if (isMounted) {
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
          toast.error("Error checking permissions");
          navigate('/');
        }
      }
    };
    
    // Check admin status immediately
    checkAdminRole();
    
    return () => {
      isMounted = false;
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
