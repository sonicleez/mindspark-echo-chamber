
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
// @ts-ignore
import { JSDOM } from 'https://jsdom.iife.deno.dev';
// @ts-ignore
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

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

// Function to extract metadata from a URL using web scraping
async function extractMetadata(url: string) {
  try {
    // Fetch the content of the URL
    const response = await fetch(url);
    const html = await response.text();

    // Parse the HTML content
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract title
    const titleTag = document.querySelector('title');
    const title = titleTag ? titleTag.textContent.trim() : '';

    // Extract description
    const descriptionTag = document.querySelector('meta[name="description"]');
    const description = descriptionTag ? descriptionTag.getAttribute('content') : '';

    // Extract image URL
    const ogImageTag = document.querySelector('meta[property="og:image"]');
    const imageUrl = ogImageTag ? ogImageTag.getAttribute('content') : '';

    // Extract main content for potential summarization
    const content = extractMainContent(document);

    return { title, description, imageUrl, content };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return { title: '', description: '', imageUrl: '', content: '' };
  }
}

// Helper function to extract the main content from the document
function extractMainContent(document: any) {
  // This is a simple implementation, real-world extraction would be more sophisticated
  const bodyText = document.body.textContent;
  const cleanText = bodyText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000); // Limit to 5000 characters for API limits
  return cleanText;
}

// Function to generate tags and summary using OpenAI
async function enhanceMetadata(metadata: any) {
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
          content: "You are an AI that extracts metadata from web content. Given content from a webpage, provide a concise summary and 3-5 relevant tags. Format your response as JSON with 'summary' and 'tags' fields."
        },
        {
          role: "user",
          content: `Title: ${metadata.title}\nDescription: ${metadata.description}\nContent: ${metadata.content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
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
    let enhancedData = { summary: '', tags: [] };

    try {
      const content = data.choices[0].message.content;
      enhancedData = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Try to extract information in a more lenient way
      const content = data.choices[0].message.content;
      const summaryMatch = content.match(/["']?summary["']?:\s*["']([^"']*)["']/i);
      const tagsMatch = content.match(/["']?tags["']?:\s*\[(.*?)\]/i);

      if (summaryMatch && summaryMatch[1]) {
        enhancedData.summary = summaryMatch[1];
      }

      if (tagsMatch && tagsMatch[1]) {
        enhancedData.tags = tagsMatch[1]
          .split(',')
          .map((tag: string) => tag.trim().replace(/["']/g, ''))
          .filter(Boolean);
      }
    }

    return {
      ...metadata,
      summary: enhancedData.summary,
      tags: enhancedData.tags,
    };
  } catch (error) {
    console.error('Error enhancing metadata:', error);
    return {
      ...metadata,
      summary: '',
      tags: [],
    };
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
    const { url, useOpenAiKey = false } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract basic metadata from the URL
    const metadata = await extractMetadata(url);
    
    // Enhance metadata with AI if content exists
    if (metadata.content) {
      const enhancedMetadata = await enhanceMetadata(metadata);
      
      return new Response(JSON.stringify(enhancedMetadata), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify(metadata), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
