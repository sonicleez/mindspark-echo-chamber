
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserMenu from './UserMenu';

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
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
      </div>
    </header>
  );
};

export default Header;
