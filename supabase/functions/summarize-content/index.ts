
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getActiveApiKey(service: string): Promise<string | null> {
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

// Function to summarize content using OpenAI
async function summarizeContent(content: string) {
  try {
    const apiKey = await getActiveApiKey('openai') || openaiApiKey;
    if (!apiKey) {
      throw new Error('No OpenAI API key available');
    }

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI that summarizes text content. Given text content, provide a concise summary in 1-2 sentences."
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.5,
      max_tokens: 100
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}

// Main handler function
serve(async (req: Request) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, useOpenAiKey = false } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Summarize the content
    const summary = await summarizeContent(content);
    
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
