
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiServiceType } from '@/types/apiKeys';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Import refactored components
import ApiServiceInfo from './ApiServiceInfo';
import ApiKeysList from './ApiKeysList';
import AddApiKeyDialog from './AddApiKeyDialog';
import DeleteApiKeyDialog from './DeleteApiKeyDialog';

interface ApiService {
  id: string;
  name: string;
  description: string;
  url: string;
  active_key_id?: string | null;
  keys: ApiKey[];
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  service: ApiServiceType;
}

const APIServiceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<ApiServiceType>('openai');
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Fetch API services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['apiServices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_services')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading: isLoadingKeys } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*');
      
      if (error) throw error;
      
      return (data || []).map(key => ({
        ...key,
        service: key.service || 'openai' as ApiServiceType
      }));
    }
  });

  // Group API keys by service
  const apiServices = services.map(serviceDef => {
    const serviceId = serviceDef.service as ApiServiceType;
    // Filter keys by service
    const serviceKeys = apiKeys.filter(key => key.service === serviceId);
    
    // Find the active key
    const activeKey = serviceKeys.find(key => key.is_active === true);
    
    return {
      ...serviceDef,
      active_key_id: activeKey?.id || null,
      keys: serviceKeys
    };
  });

  const addApiKey = useMutation({
    mutationFn: async (data: { name: string, key: string }) => {
      if (!data.name.trim() || !data.key.trim()) {
        throw new Error('Name and API key are required');
      }
      
      // Look for existing active keys for this service
      const existingActiveKeys = apiKeys.filter(
        key => key.service === selectedService && key.is_active === true
      );
      
      const { data: newKey, error } = await supabase
        .from('api_keys')
        .insert({
          name: data.name.trim(),
          key: data.key.trim(),
          service: selectedService,
          is_active: existingActiveKeys.length === 0, // Make active only if no other active key exists
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .select();
        
      if (error) throw error;
      return newKey[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setIsAddKeyDialogOpen(false);
      toast.success('API key added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add API key: ${error.message}`);
    }
  });

  const deleteApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setKeyToDelete(null);
      toast.success('API key deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete API key: ${error.message}`);
    }
  });

  const setActiveKey = useMutation({
    mutationFn: async ({ keyId }: { keyId: string }) => {
      // Get the key to activate
      const keyToActivate = apiKeys.find(key => key.id === keyId);
      if (!keyToActivate) throw new Error("Key not found");
      
      const serviceType = keyToActivate.service;
      
      // First, deactivate all keys for this service
      const { error: deactivateError } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('service', serviceType);
        
      if (deactivateError) throw deactivateError;
      
      // Then, activate the selected key
      const { error: activateError } = await supabase
        .from('api_keys')
        .update({ is_active: true })
        .eq('id', keyId);
        
      if (activateError) throw activateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('Active API key updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update active API key: ${error.message}`);
    }
  });

  const handleAddKey = (name: string, key: string) => {
    addApiKey.mutate({ name, key });
  };

  const handleDeleteKey = () => {
    if (keyToDelete) {
      deleteApiKey.mutate(keyToDelete);
    }
  };

  const selectedServiceConfig = apiServices.find(s => s.service === selectedService);
  const isLoading = isLoadingServices || isLoadingKeys;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI API Key Management</h2>
        <Button onClick={() => setIsAddKeyDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New API Key
        </Button>
      </div>
      
      <Tabs defaultValue="openai" value={selectedService} onValueChange={(value) => setSelectedService(value as ApiServiceType)}>
        <TabsList className="mb-4">
          {apiServices.map(service => (
            <TabsTrigger key={service.service} value={service.service}>
              {service.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {isLoading ? (
          <div className="p-4 text-center">Loading API key configurations...</div>
        ) : (
          <>
            {apiServices.map(service => (
              <TabsContent key={service.service} value={service.service} className="space-y-6">
                {/* Service info component */}
                <ApiServiceInfo 
                  name={service.name}
                  description={service.description}
                  url={service.url}
                />
                
                {/* API keys list component */}
                <ApiKeysList 
                  serviceName={service.name}
                  keys={service.keys}
                  activeKeyId={service.active_key_id}
                  onAddKey={() => setIsAddKeyDialogOpen(true)}
                  onDeleteKey={(keyId) => setKeyToDelete(keyId)}
                  onSetActiveKey={(keyId) => setActiveKey.mutate({ keyId })}
                />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
      
      {/* Dialogs */}
      <AddApiKeyDialog 
        open={isAddKeyDialogOpen}
        onOpenChange={setIsAddKeyDialogOpen}
        onAddKey={handleAddKey}
        selectedServiceName={selectedServiceConfig?.name || ''}
      />
      
      <DeleteApiKeyDialog 
        open={!!keyToDelete}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        onConfirmDelete={handleDeleteKey}
      />
    </div>
  );
};

export default APIServiceManagement;
