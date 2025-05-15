
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

// AI Provider Adapters
const aiProviders = {
  openai: async (content: string, config: any) => {
    try {
      console.log("Using OpenAI provider with config:", config);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful assistant that summarizes content. Create a concise summary of the following text.'
            },
            { role: 'user', content }
          ],
          max_tokens: config.max_tokens || 100,
          temperature: config.temperature || 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI provider error:", error);
      throw error;
    }
  },

  gemini: async (content: string, config: any) => {
    try {
      console.log("Using Gemini provider with config:", config);
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + 
        (config.model || 'gemini-pro') + ':generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Create a concise summary of the following text:\n\n" + content
                }
              ]
            }
          ],
          generationConfig: {
            temperature: config.temperature || 0.7,
            maxOutputTokens: config.max_tokens || 100,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error("Gemini provider error:", error);
      throw error;
    }
  },

  openrouter: async (content: string, config: any) => {
    try {
      console.log("Using OpenRouter provider with config:", config);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': supabaseUrl,
          'X-Title': 'Content Summarizer'
        },
        body: JSON.stringify({
          model: config.model || 'openai/gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful assistant that summarizes content. Create a concise summary of the following text.'
            },
            { role: 'user', content }
          ],
          max_tokens: config.max_tokens || 100,
          temperature: config.temperature || 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenRouter provider error:", error);
      throw error;
    }
  }
};

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

serve(async (req) => {
  // Handle CORS preflight
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

    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get active AI configuration
    const config = await getActiveConfig(supabase);
    console.log("Using AI config:", config);

    // Calculate approximate tokens (very rough estimate)
    const estimatedTokens = Math.ceil(content.length / 4);
    
    // Use the appropriate AI provider
    let summary;
    let success = true;

    try {
      if (!aiProviders[config.provider]) {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
      
      summary = await aiProviders[config.provider](content, config);
      
      // If summary is too short and provider isn't the only one available, try fallback
      if (summary.length < 10 && config.provider !== 'openai' && OPENAI_API_KEY) {
        console.log("Summary too short, trying OpenAI fallback");
        summary = await aiProviders.openai(content, {
          model: 'gpt-3.5-turbo',
          max_tokens: 100,
          temperature: 0.7
        });
      }
    } catch (error) {
      console.error(`Error with ${config.provider}:`, error);
      success = false;
      
      // Fallback to basic summarization if AI fails
      summary = content.length > 100 
        ? content.substring(0, 100) + "..." 
        : content;
    }
    
    // Log the usage
    await logUsage(
      supabase, 
      config.id, 
      userId, 
      'summarize-content',
      estimatedTokens, 
      success
    );

    return new Response(
      JSON.stringify({ summary }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("General error in summarize-content:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
