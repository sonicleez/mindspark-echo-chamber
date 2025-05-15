import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Space } from '@/services/spacesService';
import { Plus, Check } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface SpaceSelectorProps {
  spaces: Space[];
  selectedSpace: Space | null;
  onSelectSpace: (space: Space) => void;
  onAddSpace: (name: string, description: string) => Promise<void>;
}

const SpaceSelector: React.FC<SpaceSelectorProps> = ({ 
  spaces, 
  selectedSpace, 
  onSelectSpace, 
  onAddSpace 
}) => {
  const [isAddSpaceDialogOpen, setIsAddSpaceDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  
  const handleAddSpace = async () => {
    if (!newSpaceName.trim()) return;
    
    await onAddSpace(newSpaceName.trim(), newSpaceDescription.trim());
    
    // Reset form and close dialog
    setNewSpaceName('');
    setNewSpaceDescription('');
    setIsAddSpaceDialogOpen(false);
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-[#1E1E24] border-[#333] text-white hover:bg-[#2A2A30] hover:text-white"
          >
            {selectedSpace ? selectedSpace.name : 'Select Space'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1E1E24] border-[#333] text-white">
          {spaces.map(space => (
            <DropdownMenuItem 
              key={space.id}
              className="flex items-center justify-between cursor-pointer hover:bg-[#2A2A30]"
              onClick={() => onSelectSpace(space)}
            >
              <span>{space.name}</span>
              {selectedSpace && selectedSpace.id === space.id && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-[#333]" />
          
          <DropdownMenuItem 
            className="flex items-center cursor-pointer hover:bg-[#2A2A30]"
            onClick={() => setIsAddSpaceDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Create New Space</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={isAddSpaceDialogOpen} onOpenChange={setIsAddSpaceDialogOpen}>
        <DialogContent className="bg-[#1E1E24] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Space</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-300">
                Name
              </label>
              <Input
                id="name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Enter space name"
                className="bg-[#2A2A30] border-[#333] text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-300">
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                placeholder="Enter space description"
                className="bg-[#2A2A30] border-[#333] text-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsAddSpaceDialogOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-[#333]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddSpace}
              className="bg-[#FF5733] hover:bg-[#FF5733]/80 text-white"
              disabled={!newSpaceName.trim()}
            >
              Create Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SpaceSelector;
