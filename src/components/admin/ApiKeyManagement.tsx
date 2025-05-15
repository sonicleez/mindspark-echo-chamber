
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  Table, TableHeader, TableRow, TableHead,
  TableBody, TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Copy, Trash2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
}

const ApiKeyManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [newKey, setNewKey] = useState('');
  
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  const createApiKey = useMutation({
    mutationFn: async () => {
      const key = `key_${uuidv4().replace(/-/g, '')}`;
      let expiresAt = null;
      
      if (expiryDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + expiryDays);
        expiresAt = date.toISOString();
      }
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName,
          key: key,
          created_by: user!.id,
          expires_at: expiresAt,
        });
        
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setNewKey(key);
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });
  
  const toggleApiKeyStatus = useMutation({
    mutationFn: async ({ keyId, isActive }: { keyId: string, isActive: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key updated');
    },
    onError: (error) => {
      toast.error(`Failed to update API key: ${error.message}`);
    },
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
      toast.success('API key deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete API key: ${error.message}`);
    },
  });
  
  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    
    createApiKey.mutate();
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };
  
  const handleCloseNewKeyDialog = () => {
    setShowNewKeyDialog(false);
    setNewKeyName('');
    setExpiryDays(30);
    setNewKey('');
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">API Keys</h2>
        <Button onClick={() => setShowNewKeyDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New API Key
        </Button>
      </div>
      
      {/* API Keys List */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-4">
                  No API keys found
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow 
                  key={apiKey.id}
                  className={isExpired(apiKey.expires_at) ? "bg-red-50" : ""}
                >
                  <TableCell>{apiKey.name}</TableCell>
                  <TableCell>{new Date(apiKey.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {apiKey.expires_at 
                      ? new Date(apiKey.expires_at).toLocaleDateString() 
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {apiKey.last_used_at 
                      ? new Date(apiKey.last_used_at).toLocaleDateString() 
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Switch
                        checked={apiKey.is_active && !isExpired(apiKey.expires_at)}
                        disabled={isExpired(apiKey.expires_at)}
                        onCheckedChange={(checked) => 
                          toggleApiKeyStatus.mutate({ keyId: apiKey.id, isActive: checked })
                        }
                      />
                      <span className="ml-2">
                        {isExpired(apiKey.expires_at) 
                          ? 'Expired' 
                          : apiKey.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteApiKey.mutate(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* New API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a name and set an expiration.
            </DialogDescription>
          </DialogHeader>
          
          {newKey ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">API Key Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">Your new API key:</p>
                <div className="flex items-center">
                  <code className="bg-white p-2 rounded border flex-1 overflow-x-auto">
                    {newKey}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => copyToClipboard(newKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-4 text-red-500">
                  Make sure to copy this key now. You won't be able to see it again!
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCloseNewKeyDialog}>Done</Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name">API Key Name</label>
                  <Input
                    id="name"
                    placeholder="MyApplication"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="expiry">Expires After (Days)</label>
                  <Input
                    id="expiry"
                    type="number"
                    placeholder="30"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                  />
                  <span className="text-xs text-muted-foreground">
                    Set to 0 for a non-expiring key
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseNewKeyDialog}>Cancel</Button>
                <Button onClick={handleCreateKey}>Create API Key</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeyManagement;
