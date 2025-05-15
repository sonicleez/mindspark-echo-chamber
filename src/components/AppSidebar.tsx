
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
import RiveAnimation from './RiveAnimation';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
    <Sidebar side="left" variant="sidebar" className="border-r border-[#333]">
      <SidebarHeader className="py-4 border-b border-[#333]">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-white">my<span className="text-[#9b87f5]">mind</span></h2>
          <div className="w-6 h-6">
            <AspectRatio ratio={1}>
              <RiveAnimation 
                src="/Addnew.riv" 
                className="w-full h-full" 
                fit="contain"
              />
            </AspectRatio>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Home" 
                  className={cn(
                    currentSpaceId === null ? "bg-[#9b87f5]/20 text-[#9b87f5]" : ""
                  )}
                >
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
              {spaces.length > 0 ? (
                spaces.map((space) => (
                  <SidebarMenuItem key={space.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={currentSpaceId === space.id}
                      tooltip={space.description || space.name}
                    >
                      <button 
                        className={cn("w-full text-left", 
                          currentSpaceId === space.id && "bg-[#9b87f5]/20 text-[#9b87f5]"
                        )}
                        onClick={() => onSpaceChange(space.id)}
                      >
                        <span className="h-4 w-4 rounded-full bg-[#9b87f5]/30"></span>
                        <span className="truncate">{space.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No spaces yet. Create your first space.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#333]">
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
