
import { supabase } from '@/integrations/supabase/client';
import { ApiServiceType } from '@/types/apiKeys';

/**
 * Get the active API key for a specific service
 */
export async function getActiveApiKey(service: ApiServiceType): Promise<string | null> {
  try {
    // First get the active key ID from the service configuration
    const { data: serviceData, error: serviceError } = await supabase
      .from('api_services')
      .select('active_key_id')
      .eq('service', service)
      .single();
    
    if (serviceError) throw serviceError;
    
    // If no active key is set, return null
    if (!serviceData?.active_key_id) return null;
    
    // Get the actual key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('key')
      .eq('id', serviceData.active_key_id)
      .single();
    
    if (keyError) throw keyError;
    
    // Update last_used_at timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', serviceData.active_key_id);
    
    return keyData?.key || null;
  } catch (error) {
    console.error('Error fetching active API key:', error);
    return null;
  }
}

/**
 * Update the metadata extraction function to use the OpenAI API key from our management system
 */
export async function extractMetadataWithManagedKey(url: string) {
  try {
    const { data, error } = await supabase.functions.invoke('extract-metadata', {
      body: { url, useOpenAiKey: true }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw error;
  }
}

/**
 * Update the summarization function to use the OpenAI API key from our management system
 */
export async function summarizeContentWithManagedKey(content: string) {
  try {
    const { data, error } = await supabase.functions.invoke('summarize-content', {
      body: { content, useOpenAiKey: true }
    });
    
    if (error) throw error;
    return data.summary;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}
