
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, useOpenAiKey } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch the page content
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get the OpenAI API key from database if useOpenAiKey is true
    let apiKey = openAIApiKey;
    if (useOpenAiKey) {
      // Create a Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      const { data: keyData, error: keyError } = await supabaseClient
        .from('api_keys')
        .select('key')
        .eq('service', 'openai')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!keyError && keyData?.key) {
        apiKey = keyData.key;
      }
    }
    
    // If no API key is available, return an error
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'No OpenAI API key available' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const html = await response.text();
    const title = extractTitle(html);
    const description = extractDescription(html);
    
    // Use OpenAI to extract more relevant metadata
    try {
      const metadata = await extractMetadataWithAI(url, title, description, apiKey);
      return new Response(
        JSON.stringify(metadata),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (aiError) {
      console.error("AI extraction failed:", aiError);
      // Fall back to basic metadata
      return new Response(
        JSON.stringify({ 
          title: title || "Unknown title", 
          description: description || "No description available",
          tags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1] : null;
}

function extractDescription(html: string): string | null {
  const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
  if (descMatch) return descMatch[1];
  
  const ogDescMatch = html.match(/<meta property="og:description" content="(.*?)"/i);
  return ogDescMatch ? ogDescMatch[1] : null;
}

async function extractMetadataWithAI(url: string, title: string | null, description: string | null, apiKey: string) {
  const prompt = `
Extract metadata from this URL: ${url}
Title: ${title || "Unknown"}
Description: ${description || "None"}

Please provide the following in JSON format:
1. A concise, clear title (max 100 characters)
2. A summarized description (max 200 characters)
3. 3-5 relevant tags as an array of strings
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a metadata extraction assistant. Extract structured metadata from URLs in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const aiResponse = JSON.parse(data.choices[0].message.content);
  
  return {
    title: aiResponse.title || title || "Unknown title",
    description: aiResponse.description || description || "No description available",
    tags: aiResponse.tags || []
  };
}
