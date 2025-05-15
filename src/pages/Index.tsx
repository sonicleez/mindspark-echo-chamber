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
import { getSpaces, createSpace, updateSpace, deleteSpace, Space } from '@/services/spacesService';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';

const Index: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);

  // Queries
  const { data: spaces = [], isLoading: isLoadingSpaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: getSpaces,
  });
  
  const { data: itemsData = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', currentSpaceId],
    queryFn: () => getItems(currentSpaceId),
  });
  
  // Convert any string dates to Date objects to ensure type compatibility
  const items: Item[] = itemsData.map(item => ({
    ...item,
    dateAdded: item.dateAdded instanceof Date ? item.dateAdded : new Date(item.dateAdded)
  }));
  
  // Mutations
  const addItemMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentSpaceId] });
      toast.success('Mục đã được thêm thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể thêm mục: ${error.message}`);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Item, 'id' | 'dateAdded'>> }) => 
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Mục đã được cập nhật thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật mục: ${error.message}`);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Mục đã được xóa thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể xóa mục: ${error.message}`);
    }
  });

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: (newSpace) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setCurrentSpaceId(newSpace.id);
      toast.success('Không gian đã được tạo thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể tạo không gian: ${error.message}`);
    }
  });

  const updateSpaceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Space, 'id' | 'created_at'>> }) => 
      updateSpace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Không gian đã được cập nhật thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể cập nhật không gian: ${error.message}`);
    }
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setCurrentSpaceId(null);
      toast.success('Không gian đã được xóa thành công');
    },
    onError: (error: Error) => {
      toast.error(`Không thể xóa không gian: ${error.message}`);
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

  // Event handlers
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
    if (window.confirm('Bạn có chắc muốn xóa mục này không?')) {
      deleteItemMutation.mutate(id);
      setIsDetailOpen(false);
    }
  };

  const handleCreateSpace = async (spaceData: { name: string; description?: string }) => {
    await createSpaceMutation.mutateAsync(spaceData);
  };

  const handleUpdateSpace = async (id: string, spaceData: { name: string; description?: string }) => {
    await updateSpaceMutation.mutateAsync({ id, data: spaceData });
  };

  const handleDeleteSpace = async (id: string) => {
    await deleteSpaceMutation.mutateAsync(id);
  };

  const handleSpaceChange = (spaceId: string | null) => {
    setCurrentSpaceId(spaceId);
  };

  const handleOpenCreateSpaceDialog = () => {
    // This function would be passed to the sidebar to open the create space dialog
    // Using the existing SpaceSelector's functionality
    document.getElementById('create-space-button')?.click();
  };

  const isLoading = isLoadingItems || isLoadingSpaces;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#121212]">
        <AppSidebar 
          spaces={spaces} 
          currentSpaceId={currentSpaceId}
          onSpaceChange={handleSpaceChange}
          onCreateSpace={handleOpenCreateSpaceDialog}
        />
        <SidebarInset>
          <Header onAddItem={handleAddItem} onSearch={handleSearch} />
          
          <main className="container mx-auto px-4 pt-20 pb-8">
            <div className="pt-4 mb-6 flex justify-between">
              <div id="space-selector-container" className="hidden">
                {/* We keep the SpaceSelector component to maintain its functionality, but hide it visually */}
                <span id="create-space-button" className="hidden"></span>
              </div>
              <div className="w-full">
                <Filters currentFilter={currentFilter} onFilterChange={handleFilterChange} />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
              </div>
            ) : filteredItems.length > 0 ? (
              <ItemGrid items={filteredItems} onItemClick={handleItemClick} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-[#1A1A1A]/30 rounded-lg border border-[#333] backdrop-blur-sm">
                <p className="text-lg">Không tìm thấy mục nào</p>
                <Button 
                  variant="link" 
                  onClick={handleAddItem}
                  className="mt-2 text-[#9b87f5] hover:text-[#7E69AB]"
                >
                  Thêm mục mới
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
            spaces={spaces}
            currentSpaceId={currentSpaceId}
          />

          <EditItemDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onEditItem={handleUpdateItem}
            item={selectedItem}
            spaces={spaces}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
