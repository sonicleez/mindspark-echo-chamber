
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Sidebar, 
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  Home, 
  Settings, 
  FolderPlus, 
  LogOut, 
  User, 
  Shield, 
  Tag, 
  Grid, 
  ListFilter,
  Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppSidebarProps {
  onAddItem: () => void;
  onFilterToggle: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ onAddItem, onFilterToggle }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  
  const { data: isAdmin } = useQuery({
    queryKey: ['userAdminStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error || !data) return false;
      return data.is_admin || false;
    },
    enabled: !!user,
  });
  
  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U';
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const handleAddNew = () => {
    onAddItem();
    toast.success("Bắt đầu thêm mục mới");
  };

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MyMind</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/')} 
                  tooltip="Home"
                  isActive={location.pathname === '/'}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onFilterToggle()} 
                  tooltip="Filters"
                >
                  <ListFilter className="h-4 w-4" />
                  <span>Filters</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleAddNew}
                  tooltip="Add New Item"
                  className={cn("bg-[#9b87f5]", state === "collapsed" ? "hover:bg-[#8a76e4]" : "hover:bg-[#8a76e4]")}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Avatar className="h-5 w-5 mr-1">
                    <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span>{user?.email}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Profile">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/admin')}
                    tooltip="Admin"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  tooltip="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
