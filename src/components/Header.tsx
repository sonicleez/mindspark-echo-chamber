
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';
import { useRive } from '@rive-app/react-canvas';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  // Configure Rive with autoplay set to false so we can control it
  const { RiveComponent, rive } = useRive({
    src: 'https://rive.app/s/LevuX-GdcU_onEuVgwPn3g/embed',
    autoplay: false,
    stateMachines: 'State Machine 1',
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  // Handle the Add button click with animation
  const handleAddClick = () => {
    if (rive) {
      // Play the animation first
      rive.play();
      
      // Add a delay before calling onAddItem to allow animation to play
      setTimeout(() => {
        onAddItem();
      }, 300);
    } else {
      // Fallback if rive isn't loaded
      onAddItem();
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
            onClick={handleAddClick}
            variant="ghost" 
            className="p-2 hover:bg-[#333] text-white flex items-center"
          >
            <div className="h-5 w-5 flex items-center justify-center">
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
