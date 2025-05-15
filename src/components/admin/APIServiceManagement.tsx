
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiServiceType, ApiKeyConfig } from '@/types/apiKeys';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Key, Plus, Trash2, CheckCircle } from 'lucide-react';

// Define service information locally since we don't have an api_services table
const serviceDefinitions = [
  { 
    service: 'openai' as ApiServiceType, 
    name: 'OpenAI', 
    description: 'API for accessing powerful language models like GPT-4',
    url: 'https://platform.openai.com/docs/api-reference'
  },
  { 
    service: 'perplexity' as ApiServiceType, 
    name: 'Perplexity AI',
    description: 'Access advanced AI models for document understanding and generation',
    url: 'https://docs.perplexity.ai'
  },
  { 
    service: 'anthropic' as ApiServiceType,
    name: 'Anthropic Claude',
    description: 'Claude AI models for natural language understanding and generation',
    url: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api'
  },
  { 
    service: 'google' as ApiServiceType,
    name: 'Google AI',
    description: 'Google Gemini and other AI models for various tasks',
    url: 'https://ai.google.dev/docs'
  },
  { 
    service: 'custom' as ApiServiceType,
    name: 'Custom API',
    description: 'Custom API integrations for specialized needs',
    url: 'https://example.com/api-docs'
  }
];

const APIServiceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<ApiServiceType>('openai');
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Group API keys by service
  const apiServices = serviceDefinitions.map(serviceDef => {
    const serviceKeys = apiKeys.filter(key => key.service === serviceDef.service);
    // Find the active key (using the first active key found)
    const activeKey = serviceKeys.find(key => key.is_active === true);
    
    return {
      ...serviceDef,
      active_key_id: activeKey?.id || null,
      keys: serviceKeys
    };
  });

  const addApiKey = useMutation({
    mutationFn: async () => {
      if (!newKeyName.trim() || !newApiKey.trim()) {
        throw new Error('Name and API key are required');
      }
      
      // Look for existing active keys for this service
      const existingActiveKeys = apiKeys.filter(
        key => key.service === selectedService && key.is_active === true
      );
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName.trim(),
          key: newApiKey.trim(),
          service: selectedService,
          is_active: existingActiveKeys.length === 0, // Make active only if no other active key exists
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setIsAddKeyDialogOpen(false);
      setNewKeyName('');
      setNewApiKey('');
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
      // Get the key to activate to determine its service
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleAddKey = () => {
    addApiKey.mutate();
  };

  const confirmDeleteKey = (keyId: string) => {
    setKeyToDelete(keyId);
  };

  const handleDeleteKey = () => {
    if (keyToDelete) {
      deleteApiKey.mutate(keyToDelete);
    }
  };

  const handleSetActiveKey = (keyId: string) => {
    setActiveKey.mutate({ keyId });
  };

  const selectedServiceConfig = apiServices.find(s => s.service === selectedService);

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
                <Card>
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h3 className="font-medium">Documentation</h3>
                      <a 
                        href={service.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {service.name} API Documentation
                      </a>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Available API Keys</h3>
                      {service.keys.length === 0 ? (
                        <p className="text-gray-500">No API keys configured. Add a new key to start using {service.name} API.</p>
                      ) : (
                        <div className="space-y-3">
                          {service.keys.map(key => (
                            <div 
                              key={key.id} 
                              className={`p-3 border rounded-lg flex items-center justify-between ${key.id === service.active_key_id ? 'bg-green-50 border-green-200' : ''}`}
                            >
                              <div className="flex items-center space-x-3">
                                <Key className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">{key.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Created: {new Date(key.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                {key.is_active && (
                                  <Badge className="bg-green-500">Active</Badge>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                {!key.is_active && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleSetActiveKey(key.id)}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Set Active
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(key.key)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="sr-only">Copy</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 hover:bg-red-50"
                                  onClick={() => confirmDeleteKey(key.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
      
      {/* Add API Key Dialog */}
      <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Add a new API key for {selectedServiceConfig?.name || 'selected service'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="keyName" className="text-sm font-medium">Key Name</label>
              <Input
                id="keyName"
                placeholder="My API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">API Key</label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter the API key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddKey} disabled={!newKeyName || !newApiKey}>Add Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default APIServiceManagement;
