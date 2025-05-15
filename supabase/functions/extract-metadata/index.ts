
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
      
      const metadata = {
        title: title || `Content from ${url}`,
        description: description || `Description from ${url}`,
        image: image,
        favicon: favicon,
        tags: tags,
      };
      
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
