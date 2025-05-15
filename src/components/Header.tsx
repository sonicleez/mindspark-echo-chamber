
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { toast } from 'sonner';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Use the new animation file URL 
  const riveAnimationUrl = 'https://qkrmrlecuolwnayxbqbm.supabase.co/storage/v1/object/public/animations/1747292766881_Addnew1.riv';
  
  // Use Rive with state machine for interactivity
  const { RiveComponent, rive } = useRive({
    src: riveAnimationUrl,
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  // Create state machine inputs for hover and click interactions if they exist
  const hoverInput = useStateMachineInput(rive, 'State Machine 1', 'hover');
  const pressInput = useStateMachineInput(rive, 'State Machine 1', 'pressed');

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
            className="rive-button-container flex items-center cursor-pointer"
            onClick={handleAddButtonClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{ 
              height: '40px', 
              minWidth: '110px',
              position: 'relative' 
            }}
          >
            <RiveComponent 
              className="w-full h-full"
              style={{ 
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%'
              }} 
            />
            <span 
              className="text-white font-medium hidden sm:block z-10 pl-10 pr-2"
              style={{ position: 'relative' }}
            >
              Add New
            </span>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
