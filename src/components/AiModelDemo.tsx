
import React, { useState } from 'react';
import { useAiService } from '@/hooks/useAiService';
import { ApiServiceType } from '@/types/apiKeys';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const AiModelDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [selectedService, setSelectedService] = useState<ApiServiceType>('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  
  const { generateResponse, isLoading, error } = useAiService({
    service: selectedService,
    model: selectedModel
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    try {
      setResponse('');
      const result = await generateResponse(prompt);
      setResponse(result);
    } catch (err) {
      console.error('Error generating response:', err);
      // Error is already set in the useAiService hook
    }
  };

  // Model options for each service
  const modelOptions = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview' },
    ],
    perplexity: [
      { id: 'llama-3.1-sonar-small-128k-online', name: 'Llama 3.1 Sonar Small' },
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Llama 3.1 Sonar Large' },
      { id: 'llama-3.1-sonar-huge-128k-online', name: 'Llama 3.1 Sonar Huge' },
    ],
    anthropic: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
    google: [
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    custom: [
      { id: 'custom-model', name: 'Custom Model' },
    ],
  };
  
  const currentModelOptions = modelOptions[selectedService] || [];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>AI Model Demo</CardTitle>
        <CardDescription>
          Test different AI models and services using your configured API keys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="openai" value={selectedService} onValueChange={(value) => {
          setSelectedService(value as ApiServiceType);
          setSelectedModel(modelOptions[value as ApiServiceType][0]?.id || '');
        }}>
          <TabsList className="mb-4">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          {Object.entries(modelOptions).map(([service, models]) => (
            <TabsContent key={service} value={service}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="model" className="text-sm font-medium">Model</label>
                  <Select 
                    value={selectedModel} 
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium">Prompt</label>
                    <Textarea
                      id="prompt"
                      placeholder="Enter your prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading || !prompt.trim()}>
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" /> Generating...
                      </>
                    ) : (
                      'Generate Response'
                    )}
                  </Button>
                </form>
                
                {error && (
                  <div className="p-4 border border-red-300 bg-red-50 rounded text-red-800">
                    <strong>Error:</strong> {error.message}
                  </div>
                )}
                
                {response && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">AI Response:</h3>
                    <div className="p-4 border rounded bg-gray-50 whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-gray-500">
          Responses are generated using the active API key for each service.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AiModelDemo;
