
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ItemGrid from '@/components/ItemGrid';
import ItemDetail from '@/components/ItemDetail';
import AddItemDialog from '@/components/AddItemDialog';
import EditItemDialog from '@/components/EditItemDialog';
import Filters, { FilterType } from '@/components/Filters';
import { Item } from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, addItem, deleteItem, updateItem } from '@/services/itemsService';

const Index: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });
  
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  const addItemMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Item, 'id' | 'dateAdded'>> }) => 
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    }
  });

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

  const handleEditItem = () => {
    setIsDetailOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  const handleCreateItem = (newItemData: Omit<Item, 'id' | 'dateAdded'>) => {
    addItemMutation.mutate(newItemData);
    setIsAddDialogOpen(false);
  };
  
  const handleUpdateItem = (id: string, updatedData: Partial<Omit<Item, 'id' | 'dateAdded'>>) => {
    updateItemMutation.mutate({ id, data: updatedData });
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
      setIsDetailOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAddItem={handleAddItem} onSearch={handleSearch} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Filters currentFilter={currentFilter} onFilterChange={handleFilterChange} />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mind-accent"></div>
          </div>
        ) : filteredItems.length > 0 ? (
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
        onDelete={selectedItem ? () => handleDeleteItem(selectedItem.id) : undefined}
        onEdit={selectedItem ? handleEditItem : undefined}
      />
      
      <AddItemDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddItem={handleCreateItem}
      />

      <EditItemDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEditItem={handleUpdateItem}
        item={selectedItem}
      />
    </div>
  );
};

export default Index;
