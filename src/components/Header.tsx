
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  
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
      toast.success("Bắt đầu thêm mục mới");
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
    <header className="fixed top-0 left-0 right-0 z-10 w-full bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#333] py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white">mymind</h1>
        </div>
        
        <div className={`flex-1 max-w-xl mx-4 transition-all ${searchFocused ? 'scale-105' : ''}`}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search my mind..."
              className="w-full pl-9 bg-[#222]/50 border-none text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#9b87f5]/50 transition-all"
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            onClick={handleAddButtonClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className="relative h-10 cursor-pointer rounded-full bg-[#9b87f5] px-5 flex items-center hover:bg-[#7E69AB] transition-colors shadow-lg shadow-[#9b87f5]/20"
          >
            <div className="h-8 w-8 mr-1 flex items-center justify-center">
              <RiveComponent />
            </div>
            <span className="text-white font-medium hidden sm:block">Add New</span>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
