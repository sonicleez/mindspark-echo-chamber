
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';
import { useRive } from '@rive-app/react-canvas';
import { toast } from 'sonner';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Use the new animation file URL 
  const riveAnimationUrl = 'https://qkrmrlecuolwnayxbqbm.supabase.co/storage/v1/object/public/animations/1747294148769_Addnew2.riv';
  
  // Use Rive without state machine inputs initially to avoid errors
  const { RiveComponent, rive } = useRive({
    src: riveAnimationUrl,
    artboard: 'New Artboard',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });
  
  // Apply state inputs after rive is loaded
  useEffect(() => {
    if (rive) {
      try {
        // First check if the state machine exists using stateMachineNames
        const stateMachines = rive.stateMachineNames;
        
        if (stateMachines && stateMachines.includes('State Machine 1')) {
          // Get the inputs for this state machine
          const inputs = rive.stateMachineInputs('State Machine 1');
          
          // Find the hover and pressed inputs
          const hoverInput = inputs.find(input => input.name === 'hover');
          const pressedInput = inputs.find(input => input.name === 'pressed');
          
          // Set the values if inputs exist - using the correct method for the Rive API
          if (hoverInput) {
            // Access the input object directly through the state machine
            const stateMachine = rive.stateMachineInstance('State Machine 1');
            if (stateMachine) {
              stateMachine.setBool('hover', isHovering);
            }
          }
          
          if (pressedInput) {
            const stateMachine = rive.stateMachineInstance('State Machine 1');
            if (stateMachine) {
              stateMachine.setBool('pressed', isPressed);
            }
          }
        }
      } catch (error) {
        console.error('Error setting Rive animation inputs:', error);
      }
    }
  }, [rive, isHovering, isPressed]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  // Handle the Add button interactions
  const handleAddButtonClick = () => {
    setIsPressed(true);
    
    // Add a delay before calling onAddItem to allow animation to play
    setTimeout(() => {
      setIsPressed(false);
      onAddItem();
      toast.success("Bắt đầu thêm mục mới");
    }, 300);
  };

  // Event handler functions for mouse interactions
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsPressed(false);
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
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
            className="cursor-pointer relative"
            onClick={handleAddButtonClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{ 
              width: '110px', 
              height: '40px',
            }}
          >
            <div className="absolute inset-0">
              {rive && <RiveComponent />}
            </div>
            <span 
              className="absolute inset-0 flex items-center justify-center text-white font-medium z-10 hidden sm:flex"
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
