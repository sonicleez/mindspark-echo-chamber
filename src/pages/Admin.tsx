
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // AI configurations state
  const [configs, setConfigs] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminRole();
  }, [user]);

  // Load AI configurations
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_configs')
          .select('*')
          .order('is_active', { ascending: false });
        
        if (error) throw error;
        setConfigs(data || []);
      } catch (error) {
        console.error('Error loading AI configs:', error);
        toast('Failed to load AI configurations');
      }
    };
    
    if (isAdmin) {
      loadConfigs();
    }
  }, [isAdmin]);

  // Load usage logs
  useEffect(() => {
    const loadUsageLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_usage_logs')
          .select(`
            id, 
            operation, 
            tokens_used, 
            successful, 
            created_at,
            ai_configs (name, provider, model)
          `)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        setUsageLogs(data || []);
      } catch (error) {
        console.error('Error loading usage logs:', error);
      }
    };
    
    if (isAdmin) {
      loadUsageLogs();
    }
  }, [isAdmin]);
  
  const handleActivateConfig = async (configId: string) => {
    try {
      // First, deactivate all configs
      const { error: deactivateError } = await supabase
        .from('ai_configs')
        .update({ is_active: false })
        .neq('id', 'placeholder');
      
      if (deactivateError) throw deactivateError;
      
      // Then activate selected config
      const { error: activateError } = await supabase
        .from('ai_configs')
        .update({ is_active: true })
        .eq('id', configId);
      
      if (activateError) throw activateError;
      
      // Update local state
      setConfigs(configs.map(config => ({
        ...config,
        is_active: config.id === configId
      })));
      
      toast('AI configuration updated successfully');
    } catch (error) {
      console.error('Error activating config:', error);
      toast('Failed to update AI configuration');
    }
  };
  
  const handleAddEdit = (config: any = null) => {
    if (config) {
      setEditingConfig({
        ...config,
        additional_config: config.additional_config || {}
      });
    } else {
      setEditingConfig({
        name: '',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        temperature: 0.7,
        is_active: false,
        additional_config: {}
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!editingConfig) return;
      
      const { id, ...configData } = editingConfig;
      
      if (id) {
        // Update existing config
        const { error } = await supabase
          .from('ai_configs')
          .update(configData)
          .eq('id', id);
        
        if (error) throw error;
        
        // Update local state
        setConfigs(configs.map(c => c.id === id ? { ...c, ...configData } : c));
      } else {
        // Add new config
        const { data, error } = await supabase
          .from('ai_configs')
          .insert(configData)
          .select();
        
        if (error) throw error;
        
        // Update local state
        setConfigs([...configs, data[0]]);
      }
      
      setShowDialog(false);
      toast(`AI configuration ${id ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving config:', error);
      toast(`Failed to ${editingConfig.id ? 'update' : 'add'} AI configuration`);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const { error } = await supabase
        .from('ai_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setConfigs(configs.filter(c => c.id !== id));
      
      toast('AI configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting config:', error);
      toast('Failed to delete AI configuration');
    }
  };
  
  const formatDatetime = (datetime: string) => {
    return new Date(datetime).toLocaleString();
  };
  
  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setEditingConfig({
      ...editingConfig,
      [field]: value
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Access Required</h1>
          <p className="mb-4">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
      
      <Tabs defaultValue="configs">
        <TabsList className="mb-4">
          <TabsTrigger value="configs">AI Configurations</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">AI Configurations</h2>
            <Button onClick={() => handleAddEdit()}>Add Configuration</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map(config => (
              <Card key={config.id} className={config.is_active ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex-1">{config.name}</CardTitle>
                    {config.is_active && <Badge className="ml-2">Active</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Provider:</p>
                        <p>{config.provider}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Model:</p>
                        <p>{config.model}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Max Tokens:</p>
                        <p>{config.max_tokens}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Temperature:</p>
                        <p>{config.temperature}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAddEdit(config)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(config.id)}
                        disabled={config.is_active}
                      >
                        Delete
                      </Button>
                      {!config.is_active && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleActivateConfig(config.id)}
                        >
                          Set Active
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {configs.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No configurations found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="usage">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Usage Statistics</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Operation</th>
                  <th className="py-2 px-4 text-left">Provider</th>
                  <th className="py-2 px-4 text-left">Model</th>
                  <th className="py-2 px-4 text-left">Tokens</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">{formatDatetime(log.created_at)}</td>
                    <td className="py-2 px-4">{log.operation}</td>
                    <td className="py-2 px-4">{log.ai_configs?.provider || 'N/A'}</td>
                    <td className="py-2 px-4">{log.ai_configs?.model || 'N/A'}</td>
                    <td className="py-2 px-4">{log.tokens_used || 'Unknown'}</td>
                    <td className="py-2 px-4">
                      <Badge variant={log.successful ? "default" : "destructive"}>
                        {log.successful ? 'Success' : 'Failed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                
                {usageLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No usage logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Config Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure the AI provider settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editingConfig?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={editingConfig?.provider || 'openai'}
                onValueChange={(value) => handleInputChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={editingConfig?.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={editingConfig?.max_tokens || 1000}
                onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="temperature">Temperature (0-1)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={editingConfig?.temperature || 0.7}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editingConfig?.is_active || false}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
