
import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
import { useAdminStatus } from '@/hooks/useAdminStatus';

const AdminLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminStatus(user?.id);
  
  useEffect(() => {
    // Only redirect if we've completed the admin check and user is not an admin
    if (!isLoading && isAdmin === false) {
      console.log('AdminLayout: User is not admin, redirecting to home');
      toast.error("You don't have permission to access the admin area");
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If admin status is false, return null (the useEffect will handle redirection)
  if (isAdmin === false) {
    return null;
  }

  // User is admin, show the admin layout
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
                  <Link to="/admin/configs">
                    <Settings className="h-4 w-4" />
                    <span>Configurations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Logs" asChild>
                  <Link to="/admin/logs">
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
