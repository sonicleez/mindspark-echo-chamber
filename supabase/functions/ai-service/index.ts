
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, prompt, model, options } = await req.json();
    
    // Get active API key for the requested service
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', service)
      .eq('is_active', true)
      .limit(1)
      .single();
      
    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: `No active API key found for ${service}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update the last_used_at timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);
    
    let response;
    
    // Handle different AI service providers
    switch (service) {
      case 'openai':
        response = await callOpenAI(keyData.key, prompt, model || 'gpt-4o', options);
        break;
      case 'perplexity':
        response = await callPerplexity(keyData.key, prompt, model || 'llama-3.1-sonar-small-128k-online', options);
        break;
      case 'anthropic':
        response = await callAnthropic(keyData.key, prompt, model || 'claude-3-opus-20240229', options);
        break;
      case 'google':
        response = await callGoogle(keyData.key, prompt, model || 'gemini-1.5-pro', options);
        break;
      default:
        throw new Error(`Unsupported service: ${service}`);
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callOpenAI(apiKey: string, prompt: string, model = 'gpt-4o', options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      ...options
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI API error');
  }
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage,
    raw: data
  };
}

async function callPerplexity(apiKey: string, prompt: string, model = 'llama-3.1-sonar-small-128k-online', options = {}) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      ...options
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Perplexity API error');
  }
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage,
    raw: data
  };
}

async function callAnthropic(apiKey: string, prompt: string, model = 'claude-3-opus-20240229', options = {}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: options.max_tokens || 1000,
      ...options
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Anthropic API error');
  }
  
  return {
    content: data.content[0].text,
    model: data.model,
    usage: {
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens
    },
    raw: data
  };
}

async function callGoogle(apiKey: string, prompt: string, model = 'gemini-1.5-pro', options = {}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        topP: options.top_p || 0.95,
        topK: options.top_k || 40,
      }
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Google AI API error');
  }
  
  return {
    content: data.candidates[0].content.parts[0].text,
    model: model,
    usage: data.usageMetadata,
    raw: data
  };
}
