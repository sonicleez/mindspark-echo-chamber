
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookmarkPlus, Search } from "lucide-react";

interface HeaderProps {
  onAddItem: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddItem, onSearch }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-white/90 backdrop-blur-sm border-b border-mind-border py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-mind-text">mymind</h1>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-mind-text-secondary" />
            <Input 
              type="search" 
              placeholder="Search your mind..." 
              className="w-full pl-9 bg-secondary border-none"
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <Button 
          onClick={onAddItem}
          variant="ghost" 
          className="p-2 hover:bg-accent hover:text-accent-foreground"
        >
          <BookmarkPlus className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Add New</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
