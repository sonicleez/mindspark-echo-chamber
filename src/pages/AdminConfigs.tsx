
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, CheckCircle, TestTube } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Model options for different providers
const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  gemini: [
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
  ],
  openrouter: [
    { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
    { value: 'anthropic/claude-3-opus', label: 'Anthropic Claude 3 Opus' },
    { value: 'anthropic/claude-3-sonnet', label: 'Anthropic Claude 3 Sonnet' },
    { value: 'google/gemini-pro', label: 'Google Gemini Pro' },
    { value: 'meta-llama/llama-3-70b-instruct', label: 'Meta Llama 3 70B' },
  ]
};

// Form validation schema
const configFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.enum(["openai", "gemini", "openrouter"]),
  model: z.string().min(1, "Model is required"),
  max_tokens: z.number().int().min(1).max(100000),
  temperature: z.number().min(0).max(2).step(0.1),
  is_active: z.boolean(),
  api_key: z.string().min(1, "API Key is required"),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

const AdminConfigs = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>("");

  // Initialize form with react-hook-form
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      name: '',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7,
      is_active: false,
      api_key: '',
    }
  });

  // Load AI configurations
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        console.log("Loading AI configurations...");
        
        const { data, error } = await supabase
          .from('ai_configs')
          .select('*')
          .order('is_active', { ascending: false });
          
        if (error) {
          console.error('Supabase error loading AI configs:', error);
          setLoadError(`Failed to load configurations: ${error.message}`);
          toast.error('Failed to load AI configurations');
          throw error;
        }
        
        if (!data) {
          console.log("No data returned from Supabase");
          setConfigs([]);
          return;
        }
        
        console.log(`Loaded ${data.length} configurations`);
        
        // Process the data with better error handling for additional_config
        const processedData = data.map(config => {
          try {
            // Ensure additional_config is always a valid object
            let additional_config = {};
            
            // Handle different scenarios for additional_config
            if (config.additional_config) {
              if (typeof config.additional_config === 'string') {
                // If it's a string, try to parse it
                try {
                  additional_config = JSON.parse(config.additional_config);
                } catch (parseError) {
                  console.warn(`Failed to parse additional_config for config ${config.id}:`, parseError);
                }
              } else if (typeof config.additional_config === 'object') {
                // If it's already an object, use it directly
                additional_config = config.additional_config;
              }
            }
            
            return {
              ...config,
              additional_config: additional_config
            };
          } catch (processError) {
            console.error(`Error processing config ${config.id}:`, processError);
            // Return the config with a safe default for additional_config
            return {
              ...config,
              additional_config: {}
            };
          }
        });
        
        setConfigs(processedData);
      } catch (error: any) {
        console.error('Error loading AI configs:', error);
        setLoadError(`Failed to load configurations: ${error.message || 'Unknown error'}`);
        toast.error('Failed to load AI configurations');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfigs();
  }, []);

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
      
      toast.success('AI configuration set as active successfully');
    } catch (error: any) {
      console.error('Error activating config:', error);
      toast.error(`Failed to update AI configuration: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddEdit = (config: any = null) => {
    setTestStatus('idle');
    setTestMessage("");
    
    if (config) {
      // Safely extract API key from additional_config
      let apiKey = '';
      
      try {
        if (config.additional_config && typeof config.additional_config === 'object') {
          apiKey = config.additional_config.api_key || '';
        }
      } catch (error) {
        console.warn("Could not extract API key from config:", error);
        apiKey = '';
      }
      
      form.reset({
        name: config.name,
        provider: config.provider,
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        is_active: config.is_active,
        api_key: apiKey,
      });
      
      setEditingConfig({
        ...config,
      });
    } else {
      form.reset({
        name: '',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        temperature: 0.7,
        is_active: false,
        api_key: '',
      });
      
      setEditingConfig(null);
    }
    
    setShowDialog(true);
  };

  const handleSave = async (values: ConfigFormValues) => {
    try {
      // Prepare additional config with API key
      const additional_config = {
        api_key: values.api_key,
        has_api_key: !!values.api_key,
      };
      
      const configData = {
        name: values.name,
        provider: values.provider,
        model: values.model,
        max_tokens: values.max_tokens,
        temperature: values.temperature,
        is_active: values.is_active,
        additional_config: additional_config,
      };
      
      if (editingConfig?.id) {
        // Update existing config
        const { error } = await supabase
          .from('ai_configs')
          .update(configData)
          .eq('id', editingConfig.id);
          
        if (error) throw error;

        // Update local state
        setConfigs(configs.map(c => c.id === editingConfig.id ? { 
          ...c, 
          ...configData,
          // Don't include API key in the local state for security
          additional_config: { ...c.additional_config, has_api_key: true } 
        } : c));
        
        toast.success('AI configuration updated successfully');
      } else {
        // Add new config
        const { data, error } = await supabase
          .from('ai_configs')
          .insert(configData)
          .select();
          
        if (error) throw error;

        // Update local state with a sanitized version (no API key)
        if (data && data.length > 0) {
          const newConfig = data[0];
          newConfig.additional_config = { has_api_key: true };
          setConfigs([...configs, newConfig]);
        }
        
        toast.success('AI configuration added successfully');
      }
      
      setShowDialog(false);
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error(`Failed to ${editingConfig?.id ? 'update' : 'add'} AI configuration: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus('idle');
    setTestMessage("");
    
    const values = form.getValues();
    
    try {
      console.log(`Testing connection for provider: ${values.provider}, model: ${values.model}`);
      
      // Call the Supabase edge function
      const { data: result, error } = await supabase.functions.invoke('test-ai-connection', {
        body: {
          provider: values.provider,
          model: values.model,
          api_key: values.api_key,
        }
      });
      
      console.log("Edge function response:", result, error);
      
      if (error) {
        console.error("Error invoking function:", error);
        setTestStatus('error');
        setTestMessage(error.message || "Connection failed. Please check your API key and settings.");
        return;
      }
      
      if (result && result.success) {
        setTestStatus('success');
        setTestMessage(result.message || "Connection successful! API key is valid.");
      } else {
        setTestStatus('error');
        setTestMessage(result?.error || "Connection failed. Please check your API key and settings.");
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setTestStatus('error');
      setTestMessage(error.message || "Connection test failed. Please check your network connection.");
    } finally {
      setIsTesting(false);
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
      toast.success('AI configuration deleted successfully');
    } catch (error: any) {
      console.error('Error deleting config:', error);
      toast.error(`Failed to delete AI configuration: ${error.message || 'Unknown error'}`);
    }
  };

  // Watch the provider to update model options
  const watchedProvider = form.watch("provider");
  
  // Update model selection when provider changes
  useEffect(() => {
    const models = MODEL_OPTIONS[watchedProvider as keyof typeof MODEL_OPTIONS] || [];
    if (models.length > 0) {
      form.setValue("model", models[0].value);
    }
  }, [watchedProvider, form]);

  // Error display component
  const ErrorDisplay = () => (
    <div className="col-span-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-semibold">Failed to load configurations</h3>
      </div>
      {loadError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{loadError}</p>}
      <Button 
        variant="outline" 
        className="mt-4 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
        onClick={() => window.location.reload()}
      >
        Try Again
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading AI configurations...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">AI Configurations</h2>
        </div>
        <ErrorDisplay />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">AI Configurations</h2>
        <Button onClick={() => handleAddEdit()}>Add Configuration</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.length > 0 ? configs.map(config => (
          <Card 
            key={config.id} 
            className={config.is_active ? 'border-primary shadow-md' : ''}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="flex-1">{config.name}</CardTitle>
                {config.is_active && <Badge className="ml-2">Active</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium">Provider:</p>
                    <p className="capitalize">{config.provider}</p>
                  </div>
                  <div>
                    <p className="font-medium">Model:</p>
                    <p>{config.model}</p>
                  </div>
                  <div>
                    <p className="font-medium">Max Tokens:</p>
                    <p>{config.max_tokens}</p>
                  </div>
                  <div>
                    <p className="font-medium">Temperature:</p>
                    <p>{config.temperature}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium">API Key:</p>
                    <p>
                      {(config.additional_config?.api_key || config.additional_config?.has_api_key) ? 
                        "●●●●●●●●●●●●●●●●" : 
                        <span className="text-red-500 dark:text-red-400">Not configured</span>
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleAddEdit(config)}>
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
        )) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No configurations found</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => handleAddEdit()}
            >
              Add your first AI configuration
            </Button>
          </div>
        )}
      </div>
      
      {/* Enhanced Config Edit Dialog with Form validation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure the AI provider settings and API credentials
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My AI Configuration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODEL_OPTIONS[watchedProvider as keyof typeof MODEL_OPTIONS]?.map(model => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1} 
                          max={100000} 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (0-2)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min={0} 
                          max={2} 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={`Enter your ${watchedProvider} API key`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This API key will be securely stored and used to authenticate with the {watchedProvider} service.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {testStatus !== 'idle' && (
                <Alert variant={testStatus === 'success' ? "default" : "destructive"} className={testStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}>
                  {testStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testMessage}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Set as Active</FormLabel>
                      <FormDescription className="text-xs">
                        Make this the active AI configuration for all operations
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={isTesting || !form.getValues().api_key}
                  className="gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConfigs;
