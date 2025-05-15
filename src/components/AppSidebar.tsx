
import React from 'react';
import { Home, Plus, Settings } from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Space } from '@/services/spacesService';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  spaces: Space[];
  currentSpaceId: string | null;
  onSpaceChange: (spaceId: string | null) => void;
  onCreateSpace: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ 
  spaces, 
  currentSpaceId, 
  onSpaceChange, 
  onCreateSpace 
}) => {
  return (
    <Sidebar side="left" variant="sidebar">
      <SidebarHeader className="py-4">
        <h2 className="text-lg font-semibold text-white px-4">my<span className="text-[#9b87f5]">mind</span></h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Home">
                  <button className="w-full text-left" onClick={() => onSpaceChange(null)}>
                    <Home className="h-4 w-4" />
                    <span>All Items</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add new" className="text-[#9b87f5] hover:bg-[#9b87f5]/10">
                  <button className="w-full text-left" onClick={onCreateSpace}>
                    <Plus className="h-4 w-4" />
                    <span>Create Space</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs font-medium">
            Spaces
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {spaces.map((space) => (
                <SidebarMenuItem key={space.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentSpaceId === space.id}
                    tooltip={space.name}
                  >
                    <button 
                      className={cn("w-full text-left", 
                        currentSpaceId === space.id && "bg-[#9b87f5]/20"
                      )}
                      onClick={() => onSpaceChange(space.id)}
                    >
                      <span className="h-4 w-4 rounded-full bg-[#9b87f5]/30"></span>
                      <span>{space.name}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <a href="/admin" className="w-full text-left">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
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
