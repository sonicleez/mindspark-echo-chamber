
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`Extracting metadata from: ${url}`);
    
    // Fetch the HTML content of the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetadataBot/1.0)",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract metadata from HTML
    const metadata = extractMetadata(html, url);
    
    // Now request a summary from the summarize-content function
    // Use the correct URL format for calling another edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is not set");
    }
    
    // Build the proper URL for the edge function
    const summaryFunctionUrl = `${supabaseUrl}/functions/v1/summarize-content`;
    console.log(`Calling summary function at: ${summaryFunctionUrl}`);
    
    const summaryResponse = await fetch(summaryFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ content: metadata.description || metadata.title }),
    });
    
    if (!summaryResponse.ok) {
      throw new Error(`Failed to summarize content: ${summaryResponse.status}`);
    }
    
    const summaryData = await summaryResponse.json();
    metadata.summary = summaryData.summary;
    
    return new Response(
      JSON.stringify(metadata),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error extracting metadata:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to extract metadata", 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

function extractMetadata(html: string, sourceUrl: string): { 
  title: string; 
  description: string | null; 
  imageUrl: string | null; 
  tags: string[];
  summary?: string;
} {
  // Default response structure
  const metadata = {
    title: "",
    description: null,
    imageUrl: null,
    tags: []
  };
  
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Extract description (meta description or og:description)
  const descriptionMatch = html.match(/<meta\s+(?:name="description"|property="og:description")\s+content="(.*?)"/i) ||
                           html.match(/<meta\s+content="(.*?)"\s+(?:name="description"|property="og:description")/i);
  if (descriptionMatch && descriptionMatch[1]) {
    metadata.description = descriptionMatch[1].trim();
  }
  
  // Extract image (og:image or first image)
  const imageMatch = html.match(/<meta\s+(?:property="og:image"|name="og:image")\s+content="(.*?)"/i) ||
                     html.match(/<meta\s+content="(.*?)"\s+(?:property="og:image"|name="og:image")/i);
  if (imageMatch && imageMatch[1]) {
    metadata.imageUrl = resolveUrl(imageMatch[1].trim(), sourceUrl);
  } else {
    // Try to find the first image
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
      metadata.imageUrl = resolveUrl(imgMatch[1], sourceUrl);
    }
  }
  
  // Extract keywords/tags if available
  const keywordsMatch = html.match(/<meta\s+name="keywords"\s+content="(.*?)"/i);
  let tags: string[] = [];
  
  if (keywordsMatch && keywordsMatch[1]) {
    tags = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  
  // Generate tags from content based on common category words
  const cleanedContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const categories = ["technology", "programming", "design", "business", "health", "food", "travel", "education", "news"];
  
  const contentTags = categories.filter(category => cleanedContent.includes(category));
  
  metadata.tags = [...new Set([...tags, ...contentTags])].slice(0, 5); // Deduplicate and limit to 5 tags
  
  return metadata;
}

function resolveUrl(url: string, base: string): string {
  try {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      const baseUrl = new URL(base);
      
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `${baseUrl.protocol}${url}`;
      }
      
      // Handle root-relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl.origin}${url}`;
      }
      
      // Handle relative URLs
      return new URL(url, base).href;
    }
    
    return url;
  } catch (e) {
    console.error("Error resolving URL:", e);
    return url;
  }
}
