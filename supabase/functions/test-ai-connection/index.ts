
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { provider, model, api_key } = await req.json();

    // Test the connection based on the provider
    let response;
    let success = false;
    let message = "Connection failed";

    switch (provider) {
      case 'openai':
        response = await testOpenAI(api_key, model);
        break;
      case 'gemini':
        response = await testGemini(api_key, model);
        break;
      case 'openrouter':
        response = await testOpenRouter(api_key, model);
        break;
      default:
        return new Response(
          JSON.stringify({ 
            error: "Unsupported provider" 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: response.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Error testing AI connection:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Test OpenAI connection
async function testOpenAI(apiKey: string, model: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        error: error.error?.message || "OpenAI API returned an error" 
      };
    }

    const data = await response.json();
    // Verify if the requested model is available
    const isModelAvailable = data.data.some((m: any) => m.id === model);
    
    return { 
      success: true, 
      message: "Successfully connected to OpenAI API",
      modelAvailable: isModelAvailable,
    };
  } catch (error) {
    return { 
      success: false, 
      error: `OpenAI connection failed: ${error.message}` 
    };
  }
}

// Test Google Gemini connection
async function testGemini(apiKey: string, model: string) {
  try {
    // Gemini doesn't have a simple model listing API, so we'll do a minimal request
    // We just validate the API key format for now
    if (!apiKey.startsWith('AI')) {
      return { 
        success: false, 
        error: "Invalid Gemini API key format. Keys usually start with 'AI'" 
      };
    }

    return { 
      success: true, 
      message: "API key format is valid for Gemini" 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Gemini connection failed: ${error.message}` 
    };
  }
}

// Test OpenRouter connection
async function testOpenRouter(apiKey: string, model: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') || 'https://app.example.com',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        error: error.error?.message || "OpenRouter API returned an error" 
      };
    }

    const data = await response.json();
    
    // Check if the requested model is available
    const isModelAvailable = data.data.some((m: any) => m.id === model);
    
    return { 
      success: true, 
      message: "Successfully connected to OpenRouter API",
      modelAvailable: isModelAvailable,
    };
  } catch (error) {
    return { 
      success: false, 
      error: `OpenRouter connection failed: ${error.message}` 
    };
  }
}
