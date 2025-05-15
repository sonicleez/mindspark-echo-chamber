
import React, { useState } from 'react';
import { Check, ChevronDown, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Space } from '@/services/spacesService';
import { cn } from '@/lib/utils';

interface SpaceSelectorProps {
  spaces: Space[];
  currentSpaceId: string | null;
  onSpaceChange: (spaceId: string | null) => void;
  onCreateSpace: (space: { name: string; description?: string }) => Promise<void>;
  onEditSpace: (id: string, space: { name: string; description?: string }) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
}

const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  spaces,
  currentSpaceId,
  onSpaceChange,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  const currentSpace = currentSpaceId 
    ? spaces.find(space => space.id === currentSpaceId) 
    : null;

  const handleCreateSpace = async () => {
    if (newSpaceName.trim()) {
      await onCreateSpace({
        name: newSpaceName.trim(),
        description: newSpaceDescription.trim() || undefined
      });
      setNewSpaceName('');
      setNewSpaceDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditSpace = async () => {
    if (editingSpace && newSpaceName.trim()) {
      await onEditSpace(editingSpace.id, {
        name: newSpaceName.trim(),
        description: newSpaceDescription.trim() || undefined
      });
      resetEditForm();
      setIsEditDialogOpen(false);
    }
  };

  const openEditDialog = (space: Space) => {
    setEditingSpace(space);
    setNewSpaceName(space.name);
    setNewSpaceDescription(space.description || '');
    setIsEditDialogOpen(true);
    setIsDropdownOpen(false);
  };

  const confirmDeleteSpace = (spaceId: string) => {
    if (window.confirm('Are you sure you want to delete this space? Items in this space will be moved to "All Items".')) {
      onDeleteSpace(spaceId);
    }
    setIsDropdownOpen(false);
  };

  const resetEditForm = () => {
    setEditingSpace(null);
    setNewSpaceName('');
    setNewSpaceDescription('');
  };

  return (
    <div className="relative">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-10 px-3 flex items-center justify-between bg-[#1A1A1A] text-white border-[#333] hover:bg-[#2A2A30] hover:text-white w-full sm:w-60"
          >
            <div className="flex items-center truncate">
              {currentSpaceId === null ? 'All Items' : currentSpace?.name || 'Select Space'}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-60 bg-[#1A1A1A] border-[#333] text-white"
        >
          <DropdownMenuItem 
            onClick={() => onSpaceChange(null)}
            className={cn("flex items-center gap-2 focus:bg-[#2A2A30] focus:text-white", 
              currentSpaceId === null ? "bg-[#2A2A30]" : ""
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              All Items
            </div>
            {currentSpaceId === null && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          
          <Separator className="my-1 bg-[#333]" />
          
          {spaces.map((space) => (
            <DropdownMenuItem
              key={space.id}
              className={cn("flex items-center justify-between focus:bg-[#2A2A30] focus:text-white", 
                currentSpaceId === space.id ? "bg-[#2A2A30]" : ""
              )}
            >
              <div 
                className="flex-1 truncate" 
                onClick={() => onSpaceChange(space.id)}
              >
                {space.name}
              </div>
              <div className="flex items-center gap-1">
                {currentSpaceId === space.id && <Check className="h-4 w-4 mr-1" />}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:bg-[#333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(space);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:bg-[#333] text-red-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteSpace(space.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))}
          
          <Separator className="my-1 bg-[#333]" />
          
          <DropdownMenuItem
            onClick={() => {
              setIsCreateDialogOpen(true);
              setIsDropdownOpen(false);
            }}
            className="focus:bg-[#2A2A30] focus:text-white"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            <span>Create New Space</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Create Space Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#1E1E24] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                placeholder="Enter space name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="bg-[#2A2A30] border-[#333] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                id="description"
                placeholder="Enter space description"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                className="bg-[#2A2A30] border-[#333] text-white min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-[#333] text-white hover:bg-[#333]">
              Cancel
            </Button>
            <Button onClick={handleCreateSpace} className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Space Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="bg-[#1E1E24] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
              <Input
                id="edit-name"
                placeholder="Enter space name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="bg-[#2A2A30] border-[#333] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                id="edit-description"
                placeholder="Enter space description"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                className="bg-[#2A2A30] border-[#333] text-white min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#333] text-white hover:bg-[#333]">
              Cancel
            </Button>
            <Button onClick={handleEditSpace} className="bg-[#9b87f5] hover:bg-[#8a76e4] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpaceSelector;
