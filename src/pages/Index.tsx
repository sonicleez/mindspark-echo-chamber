
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ItemGrid from '@/components/ItemGrid';
import ItemDetail from '@/components/ItemDetail';
import AddItemDialog from '@/components/AddItemDialog';
import Filters, { FilterType } from '@/components/Filters';
import { Item } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Sample data
const sampleItems: Item[] = [
  {
    id: '1',
    title: 'The Art of Minimalist Design',
    description: 'Exploring the principles of minimalist design in modern web applications.',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    url: 'https://example.com/minimalist-design',
    tags: ['design', 'minimalism', 'web'],
    dateAdded: new Date('2025-05-10'),
  },
  {
    id: '2',
    title: 'Productivity Tools for Designers',
    description: 'A collection of the best tools to boost your design workflow.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    url: 'https://example.com/productivity-tools',
    tags: ['productivity', 'tools', 'design'],
    dateAdded: new Date('2025-05-08'),
  },
  {
    id: '3',
    title: 'Color Theory Basics',
    url: 'https://example.com/color-theory',
    tags: ['design', 'color'],
    dateAdded: new Date('2025-05-05'),
  },
  {
    id: '4',
    title: 'Typography in UI Design',
    description: 'How to choose the right fonts for your user interfaces.',
    imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80',
    tags: ['typography', 'ui', 'design'],
    dateAdded: new Date('2025-05-03'),
  },
  {
    id: '5',
    title: 'My project notes',
    description: 'Ideas and sketches for the upcoming client project.',
    tags: ['notes', 'project', 'ideas'],
    dateAdded: new Date('2025-05-01'),
  },
  {
    id: '6',
    title: 'User Experience Research Methods',
    description: 'A comprehensive guide to UX research methods and when to use them.',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
    url: 'https://example.com/ux-research-methods',
    tags: ['ux', 'research', 'design'],
    dateAdded: new Date('2025-04-29'),
  },
];

const Index: React.FC = () => {
  const [items, setItems] = useState<Item[]>(sampleItems);
  const [filteredItems, setFilteredItems] = useState<Item[]>(sampleItems);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  // Apply filters when items, searchQuery, or currentFilter changes
  useEffect(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.title.toLowerCase().includes(lowerQuery) || 
          item.description?.toLowerCase().includes(lowerQuery) || 
          item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply category filter
    if (currentFilter !== 'all') {
      result = result.filter(item => {
        switch (currentFilter) {
          case 'images':
            return !!item.imageUrl;
          case 'articles':
            return !!item.url;
          case 'notes':
            return !item.url && !item.imageUrl;
          default:
            return true;
        }
      });
    }
    
    setFilteredItems(result);
  }, [items, searchQuery, currentFilter]);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleAddItem = () => {
    setIsAddDialogOpen(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  const handleCreateItem = (newItemData: Omit<Item, 'id' | 'dateAdded'>) => {
    const newItem: Item = {
      ...newItemData,
      id: uuidv4(),
      dateAdded: new Date(),
    };
    
    setItems(prevItems => [newItem, ...prevItems]);
    toast.success('Item added successfully');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAddItem={handleAddItem} onSearch={handleSearch} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Filters currentFilter={currentFilter} onFilterChange={handleFilterChange} />
        </div>
        
        {filteredItems.length > 0 ? (
          <ItemGrid items={filteredItems} onItemClick={handleItemClick} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-mind-text-secondary">
            <p className="text-lg">No items found</p>
            <Button 
              variant="link" 
              onClick={handleAddItem}
              className="mt-2 text-mind-accent hover:text-mind-accent-hover"
            >
              Add a new item
            </Button>
          </div>
        )}
      </main>
      
      <ItemDetail 
        item={selectedItem} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
      
      <AddItemDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddItem={handleCreateItem}
      />
    </div>
  );
};

export default Index;
