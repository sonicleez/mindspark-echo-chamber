
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// API Keys for different providers
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

// Get active AI configuration
async function getActiveConfig(supabase) {
  try {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching active AI config:", error);
    // Return default config as fallback
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      max_tokens: 100,
      temperature: 0.7
    };
  }
}

// Log AI usage
async function logUsage(supabase, config_id, user_id, operation, tokens_used = 0, successful = true) {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        config_id,
        user_id,
        operation,
        tokens_used,
        successful
      });
    
    if (error) console.error("Error logging usage:", error);
  } catch (error) {
    console.error("Error in logUsage:", error);
  }
}

// Enhanced metadata extraction with AI
async function enhanceMetadataWithAI(metadata, html, config, supabase, userId) {
  // Skip AI enhancement if no API keys or if metadata already has good description
  if (
    (metadata.description && metadata.description.length > 100) ||
    ((!OPENAI_API_KEY && config.provider === 'openai') ||
     (!GEMINI_API_KEY && config.provider === 'gemini') ||
     (!OPENROUTER_API_KEY && config.provider === 'openrouter'))
  ) {
    console.log("Skipping AI enhancement");
    return metadata;
  }
  
  try {
    // Extract the page content - get text from body
    let pageContent = "";
    try {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        // Remove all HTML tags and get text only
        pageContent = bodyMatch[1].replace(/<[^>]*>/g, ' ')
                                  .replace(/\s+/g, ' ')
                                  .trim()
                                  .substring(0, 3000); // Limit content to avoid token limits
      }
    } catch (error) {
      console.error("Error extracting page content:", error);
    }
    
    if (!pageContent) return metadata;
    
    console.log(`Using ${config.provider} to enhance metadata`);
    const prompt = `
Extract key metadata from this webpage content:
${pageContent}

Current metadata:
Title: ${metadata.title || 'Unknown'}
Description: ${metadata.description || 'None'}
Tags: ${metadata.tags.join(', ') || 'None'}

Please provide:
1. An improved description (1-2 sentences) if the current one is inadequate
2. 3-5 relevant tags or keywords for the content (comma-separated)
Format: JSON with fields "description" and "tags"
`;

    let response;
    let aiResult;
    
    const estimatedTokens = Math.ceil(prompt.length / 4);

    // Use the appropriate AI provider
    if (config.provider === 'openai' && OPENAI_API_KEY) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.max_tokens || 200,
          temperature: config.temperature || 0.3,
          response_format: { type: "json_object" }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        try {
          aiResult = JSON.parse(data.choices[0].message.content);
        } catch (e) {
          console.error("Error parsing OpenAI JSON:", e);
          aiResult = null;
        }
      }
    } else if (config.provider === 'gemini' && GEMINI_API_KEY) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt + "\nRespond only with valid JSON." }]
          }],
          generationConfig: {
            temperature: config.temperature || 0.3,
            maxOutputTokens: config.max_tokens || 200,
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        try {
          const text = data.candidates[0].content.parts[0].text;
          // Extract JSON from the response (gemini might wrap it in ```json ... ```)
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
          aiResult = JSON.parse(jsonMatch[1] || text);
        } catch (e) {
          console.error("Error parsing Gemini JSON:", e);
          aiResult = null;
        }
      }
    } else if (config.provider === 'openrouter' && OPENROUTER_API_KEY) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': supabaseUrl,
          'X-Title': 'Metadata Extractor'
        },
        body: JSON.stringify({
          model: config.model || 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.max_tokens || 200,
          temperature: config.temperature || 0.3,
          response_format: { type: "json_object" }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        try {
          aiResult = JSON.parse(data.choices[0].message.content);
        } catch (e) {
          console.error("Error parsing OpenRouter JSON:", e);
          aiResult = null;
        }
      }
    }
    
    // Log the usage
    await logUsage(
      supabase, 
      config.id, 
      userId, 
      'enhance-metadata',
      estimatedTokens, 
      !!aiResult
    );

    // Update metadata with AI results if available
    if (aiResult) {
      if (aiResult.description && (!metadata.description || metadata.description.length < aiResult.description.length)) {
        metadata.description = aiResult.description;
      }
      
      if (aiResult.tags && Array.isArray(aiResult.tags)) {
        // Convert to array if it's a string
        const tagArray = Array.isArray(aiResult.tags) ? aiResult.tags : aiResult.tags.split(',').map(tag => tag.trim());
        metadata.tags = tagArray.filter(tag => tag && tag.length > 0);
      } else if (aiResult.tags && typeof aiResult.tags === 'string') {
        metadata.tags = aiResult.tags.split(',').map(tag => tag.trim()).filter(tag => tag && tag.length > 0);
      }
    }
    
    return metadata;
  } catch (error) {
    console.error("Error enhancing metadata with AI:", error);
    return metadata; // Return original metadata if AI enhancement fails
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract authorization header for user identification
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID if authenticated
    let userId = null;
    if (authHeader) {
      const { data: { user }, error } = await supabase.auth.getUser(authHeader.split(' ')[1]);
      if (!error && user) userId = user.id;
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Extracting metadata from:", url);
    
    try {
      // Fetch the actual HTML content from the URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content from URL: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract metadata using regex patterns (a basic implementation)
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : `Content from ${url}`;
      
      // Extract description from meta tags
      const descriptionMatch = html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/i) ||
                              html.match(/<meta[^>]*content=['"]([^'"]*)['"][^>]*name=['"]description['"][^>]*>/i) ||
                              html.match(/<meta[^>]*property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/i) ||
                              html.match(/<meta[^>]*content=['"]([^'"]*)['"][^>]*property=['"]og:description['"][^>]*>/i);
      const description = descriptionMatch ? descriptionMatch[1].trim() : "";
      
      // Extract image from meta tags
      const imageMatch = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]*)['"][^>]*>/i) || 
                        html.match(/<meta[^>]*content=['"]([^'"]*)['"][^>]*property=['"]og:image['"][^>]*>/i);
      const image = imageMatch ? imageMatch[1].trim() : null;
      
      // Extract favicon
      const faviconMatch = html.match(/<link[^>]*rel=['"](?:shortcut )?icon['"][^>]*href=['"]([^'"]*)['"][^>]*>/i);
      let favicon = faviconMatch ? faviconMatch[1].trim() : "/favicon.ico";
      
      // Make favicon URL absolute if it's relative
      if (favicon && !favicon.startsWith('http')) {
        const urlObj = new URL(url);
        favicon = favicon.startsWith('/') 
          ? `${urlObj.protocol}//${urlObj.host}${favicon}` 
          : `${urlObj.protocol}//${urlObj.host}/${favicon}`;
      }
      
      // Try to extract keywords or tags
      const keywordsMatch = html.match(/<meta[^>]*name=['"]keywords['"][^>]*content=['"]([^'"]*)['"][^>]*>/i) ||
                           html.match(/<meta[^>]*content=['"]([^'"]*)['"][^>]*name=['"]keywords['"][^>]*>/i);
      const tags = keywordsMatch 
        ? keywordsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : ["extracted"];
      
      let metadata = {
        title: title || `Content from ${url}`,
        description: description || `Description from ${url}`,
        image: image,
        favicon: favicon,
        tags: tags,
      };
      
      // Get active AI configuration and enhance metadata if possible
      const config = await getActiveConfig(supabase);
      metadata = await enhanceMetadataWithAI(metadata, html, config, supabase, userId);
      
      console.log("Successfully extracted metadata:", metadata);
      
      return new Response(
        JSON.stringify({ metadata }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      console.error("Error fetching or parsing URL:", fetchError);
      
      // Fallback to basic metadata if extraction fails
      const metadata = {
        title: `Content from ${url}`,
        description: `Content from ${url}`,
        image: null,
        favicon: null,
        tags: ["extracted"],
      };
      
      return new Response(
        JSON.stringify({ metadata, extractionError: fetchError.message }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
