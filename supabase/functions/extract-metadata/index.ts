
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  let descriptionMatch = html.match(/<meta\s+(?:name="description"|property="og:description")\s+content="(.*?)"/i);
  if (!descriptionMatch) {
    descriptionMatch = html.match(/<meta\s+content="(.*?)"\s+(?:name="description"|property="og:description")/i);
  }
  if (descriptionMatch && descriptionMatch[1]) {
    metadata.description = descriptionMatch[1].trim();
  }
  
  // Extract image (og:image or first image)
  let imageMatch = html.match(/<meta\s+(?:property="og:image"|name="twitter:image")\s+content="(.*?)"/i);
  if (!imageMatch) {
    imageMatch = html.match(/<meta\s+content="(.*?)"\s+(?:property="og:image"|name="twitter:image")/i);
  }
  
  if (imageMatch && imageMatch[1]) {
    metadata.imageUrl = resolveUrl(imageMatch[1], sourceUrl);
  } else {
    // Try to find the first meaningful image
    const imgMatches = html.match(/<img[^>]+src="([^">]+)"/ig);
    if (imgMatches && imgMatches.length > 0) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src="([^">]+)"/i);
        if (srcMatch && srcMatch[1] && !srcMatch[1].includes('logo') && !srcMatch[1].includes('icon')) {
          metadata.imageUrl = resolveUrl(srcMatch[1], sourceUrl);
          break;
        }
      }
    }
  }
  
  // Generate tags based on content
  const keywordsMatch = html.match(/<meta\s+(?:name="keywords"|property="article:tag")\s+content="(.*?)"/i);
  if (keywordsMatch && keywordsMatch[1]) {
    const keywords = keywordsMatch[1].split(',');
    metadata.tags = keywords.map(k => k.trim()).filter(k => k.length > 0).slice(0, 5);
  } else {
    // Extract potential tags from the content
    const bodyContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    
    // Common categories as potential tags
    const potentialTags = [
      "technology", "programming", "art", "design", "business", 
      "finance", "health", "fitness", "food", "travel", 
      "education", "science", "news", "entertainment", "tutorial"
    ];
    
    metadata.tags = potentialTags
      .filter(tag => bodyContent.includes(tag))
      .slice(0, 5);
    
    // If we couldn't extract tags, use domain name as a tag
    if (metadata.tags.length === 0) {
      try {
        const domain = new URL(sourceUrl).hostname.replace('www.', '').split('.')[0];
        if (domain) {
          metadata.tags.push(domain);
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
    }
  }
  
  return metadata;
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch (e) {
    console.error("Error resolving URL:", e);
    return url;
  }
}
