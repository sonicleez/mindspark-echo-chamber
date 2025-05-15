import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ItemGrid from '@/components/ItemGrid';
import Filters from '@/components/Filters';
import SpaceSelector from '@/components/SpaceSelector';
import AddItemDialog from '@/components/AddItemDialog';
import EditItemDialog from '@/components/EditItemDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Item } from '@/services/itemsService';
import { Space } from '@/services/spacesService';
import { addItem, updateItem, deleteItem, getItems } from '@/services/itemsService';
import { createSpace, getSpaces } from '@/services/spacesService';
import ItemDetail from '@/components/ItemDetail';
import { toast } from 'sonner';
import { SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

interface FilterType {
  types: string[];
  tags: string[];
  dateRange: { from: Date | null; to: Date | null };
}

const Index = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterType>({
    types: [],
    tags: [],
    dateRange: { from: null, to: null }
  });

  // Load spaces and items when component mounts
  useEffect(() => {
    if (user) {
      fetchSpaces();
      fetchItems();
    }
  }, [user]);

  // Update filtered items when items, search query, or filters change
  useEffect(() => {
    filterItems();
  }, [items, searchQuery, activeFilters, selectedSpace]);

  const fetchSpaces = async () => {
    try {
      const spacesData = await getSpaces();
      setSpaces(spacesData);
      
      // Select the first space by default if there is one and none is selected
      if (spacesData.length > 0 && !selectedSpace) {
        setSelectedSpace(spacesData[0]);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast.error('Failed to load spaces');
    }
  };

  const fetchItems = async () => {
    try {
      const itemsData = await getItems();
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    }
  };

  const filterItems = () => {
    // Ensure items is defined before filtering
    if (!items) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...items];
    
    // Filter by space
    if (selectedSpace) {
      filtered = filtered.filter(item => item.space_id === selectedSpace.id);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Filter by type
    if (activeFilters.types.length > 0) {
      filtered = filtered.filter(item => item.type && activeFilters.types.includes(item.type));
    }
    
    // Filter by tags
    if (activeFilters.tags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags && item.tags.some(tag => activeFilters.tags.includes(tag))
      );
    }
    
    // Filter by date range
    if (activeFilters.dateRange.from || activeFilters.dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.dateAdded);
        
        if (activeFilters.dateRange.from && activeFilters.dateRange.to) {
          return itemDate >= activeFilters.dateRange.from && itemDate <= activeFilters.dateRange.to;
        } else if (activeFilters.dateRange.from) {
          return itemDate >= activeFilters.dateRange.from;
        } else if (activeFilters.dateRange.to) {
          return itemDate <= activeFilters.dateRange.to;
        }
        
        return true;
      });
    }
    
    setFilteredItems(filtered);
  };

  const handleAddItem = async (newItem: Partial<Item>) => {
    try {
      // Make sure the new item is associated with the selected space
      if (selectedSpace) {
        newItem.space_id = selectedSpace.id;
      }
      
      // Ensure the required title property is present
      if (!newItem.title) {
        newItem.title = "Untitled";
      }
      
      const createdItem = await addItem(newItem as Omit<Item, 'id' | 'dateAdded'>);
      setItems(prevItems => [...(prevItems || []), createdItem]);
      toast.success('Item added successfully');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async (updatedItem: Partial<Item>) => {
    try {
      if (!selectedItem) return;
      
      const updated = await updateItem(selectedItem.id, updatedItem);
      
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === selectedItem.id ? { ...item, ...updated } : item
        )
      );
      
      // If the detail view is open for this item, update it too
      if (detailItem && detailItem.id === selectedItem.id) {
        setDetailItem({ ...detailItem, ...updated });
      }
      
      toast.success('Item updated successfully');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      
      // Remove item from state
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      // Close detail view if open
      if (detailItem && detailItem.id === id) {
        setDetailItem(null);
      }
      
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleAddSpace = async (name: string, description: string) => {
    try {
      const newSpace = await createSpace({ name, description });
      setSpaces(prevSpaces => [...prevSpaces, newSpace]);
      setSelectedSpace(newSpace);
      toast.success('Space created successfully');
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space');
    }
  };

  const handleItemClick = (item: Item) => {
    setDetailItem(item);
  };

  const handleEditButtonClick = (item: Item) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const handleFilterChange = (filters: FilterType) => {
    setActiveFilters(filters);
  };

  return (
    <div className="flex h-screen bg-[#121212]">
      <AppSidebar onAddItem={() => setIsAddDialogOpen(true)} onFilterToggle={toggleFilters} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onAddItem={() => setIsAddDialogOpen(true)} 
          onSearch={handleSearch}
        />
        
        <div className="flex pt-16 h-full">
          {isFiltersOpen && (
            <div className="w-64 p-4 border-r border-[#333] overflow-auto">
              <Filters onFilterChange={handleFilterChange} items={items || []} />
            </div>
          )}
          
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <SpaceSelector
                spaces={spaces}
                selectedSpace={selectedSpace}
                onSelectSpace={setSelectedSpace}
                onAddSpace={handleAddSpace}
              />
              <div className="flex items-center">
                <SidebarTrigger className="mr-2" />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <ItemGrid 
                items={filteredItems || []}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
          
          {detailItem && (
            <div className="w-1/3 border-l border-[#333] overflow-auto">
              <ItemDetail 
                item={detailItem}
                isOpen={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                onEdit={() => {
                  setSelectedItem(detailItem);
                  setIsEditDialogOpen(true);
                }} 
                onDelete={() => handleDeleteItem(detailItem.id)}
              />
            </div>
          )}
        </div>
      </div>
      
      <AddItemDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        onAddItem={handleAddItem}
      />
      
      <EditItemDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onUpdateItem={handleEditItem}
      />
    </div>
  );
};

export default Index;
