
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  // Use the specific animation file URL directly
  const riveAnimationUrl = 'https://qkrmrlecuolwnayxbqbm.supabase.co/storage/v1/object/public/animations/1747290270792_Addnew.riv';
  
  // Use Rive with state machine for interactivity
  const { RiveComponent, rive } = useRive({
    src: riveAnimationUrl,
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  // Create state machine inputs for hover and click interactions if they exist
  const hoverInput = useStateMachineInput(rive, 'State Machine 1', 'hover', false);
  const pressInput = useStateMachineInput(rive, 'State Machine 1', 'pressed', false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  // Handle the Add button interactions
  const handleAddButtonClick = () => {
    if (pressInput) {
      pressInput.fire();
    }
    
    // Add a delay before calling onAddItem to allow animation to play
    setTimeout(() => {
      onAddItem();
    }, 300);
  };

  // Event handler functions for mouse interactions
  const handleMouseEnter = () => {
    if (hoverInput) {
      hoverInput.value = true;
    }
  };

  const handleMouseLeave = () => {
    if (hoverInput) {
      hoverInput.value = false;
    }
  };

  const handleMouseDown = () => {
    if (pressInput) {
      pressInput.value = true;
    }
  };

  const handleMouseUp = () => {
    if (pressInput) {
      pressInput.value = false;
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-[#1E1E24]/90 backdrop-blur-sm border-b border-[#333] py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white">mymind</h1>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search your mind..." 
              className="w-full pl-9 bg-[#333] border-none text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF5733]/50"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAddButtonClick}
            variant="ghost" 
            className="p-2 hover:bg-[#333] text-white flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            <div className="h-8 w-8 flex items-center justify-center">
              <RiveComponent />
            </div>
            <span className="ml-2 hidden sm:inline">Add New</span>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
