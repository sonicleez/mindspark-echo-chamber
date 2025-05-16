
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("Parsing request body");
    // Parse request body
    const requestData = await req.json();
    const { provider, model, api_key } = requestData;
    
    if (!provider || !model || !api_key) {
      console.error("Missing required parameters", { provider, model, hasApiKey: !!api_key });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: provider, model, and api_key are all required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Testing connection for provider: ${provider}, model: ${model}`);

    // Test the connection based on the provider
    let response;

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
            success: false,
            error: `Unsupported provider: ${provider}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    console.log(`Test result: ${JSON.stringify(response)}`);

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
    console.log("Testing OpenAI connection");
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return { 
        success: false, 
        error: error.error?.message || `OpenAI API returned status ${response.status}` 
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
    console.error("OpenAI connection error:", error);
    return { 
      success: false, 
      error: `OpenAI connection failed: ${error.message}` 
    };
  }
}

// Test Google Gemini connection
async function testGemini(apiKey: string, model: string) {
  try {
    console.log("Testing Gemini connection");
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
    console.error("Gemini connection error:", error);
    return { 
      success: false, 
      error: `Gemini connection failed: ${error.message}` 
    };
  }
}

// Test OpenRouter connection
async function testOpenRouter(apiKey: string, model: string) {
  try {
    console.log("Testing OpenRouter connection");
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
      console.error("OpenRouter API error:", error);
      return { 
        success: false, 
        error: error.error?.message || `OpenRouter API returned status ${response.status}` 
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
    console.error("OpenRouter connection error:", error);
    return { 
      success: false, 
      error: `OpenRouter connection failed: ${error.message}` 
    };
  }
}
