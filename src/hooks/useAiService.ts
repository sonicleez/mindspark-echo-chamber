
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApiServiceType } from '@/types/apiKeys';

interface UseAiServiceOptions {
  service: ApiServiceType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface UseAiServiceReturn {
  generateResponse: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
}

export function useAiService({
  service = 'openai',
  model,
  temperature = 0.7,
  maxTokens = 1000,
}: UseAiServiceOptions): UseAiServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateResponse = async (prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-service', {
        body: {
          service,
          prompt,
          model,
          options: {
            temperature,
            max_tokens: maxTokens,
          },
        },
      });
      
      if (error) throw new Error(error.message);
      if (!data || !data.content) throw new Error('Failed to generate response');
      
      return data.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateResponse,
    isLoading,
    error,
  };
}
