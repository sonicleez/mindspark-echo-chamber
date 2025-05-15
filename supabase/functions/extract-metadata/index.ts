
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
  
  // Extract title with improved priority order
  const titlePriorities = [
    // OpenGraph title
    /<meta\s+(?:property="og:title"|name="og:title")\s+content="(.*?)"/i,
    // Twitter card title
    /<meta\s+(?:property="twitter:title"|name="twitter:title")\s+content="(.*?)"/i,
    // Standard HTML title
    /<title>(.*?)<\/title>/i,
    // Article title in schema.org JSON-LD
    /"@type"\s*:\s*"Article"[^}]*"headline"\s*:\s*"([^"]*)"/i,
    // H1 tag as fallback
    /<h1[^>]*>(.*?)<\/h1>/i
  ];
  
  for (const pattern of titlePriorities) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim()) {
      metadata.title = match[1].trim();
      break;
    }
  }
  
  // Extract description (meta description or og:description)
  const descriptionPriorities = [
    // OpenGraph description
    /<meta\s+(?:property="og:description"|name="og:description")\s+content="(.*?)"/i,
    /<meta\s+content="(.*?)"\s+(?:property="og:description"|name="og:description")/i,
    // Meta description
    /<meta\s+(?:name="description")\s+content="(.*?)"/i,
    /<meta\s+content="(.*?)"\s+(?:name="description")/i,
    // Twitter description
    /<meta\s+(?:property="twitter:description"|name="twitter:description")\s+content="(.*?)"/i,
    /<meta\s+content="(.*?)"\s+(?:property="twitter:description"|name="twitter:description")/i
  ];
  
  for (const pattern of descriptionPriorities) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim()) {
      metadata.description = match[1].trim();
      break;
    }
  }
  
  // Extract image (og:image or first image)
  const imagePriorities = [
    // OpenGraph image
    /<meta\s+(?:property="og:image"|name="og:image")\s+content="(.*?)"/i,
    /<meta\s+content="(.*?)"\s+(?:property="og:image"|name="og:image")/i,
    // Twitter image
    /<meta\s+(?:property="twitter:image"|name="twitter:image")\s+content="(.*?)"/i,
    /<meta\s+content="(.*?)"\s+(?:property="twitter:image"|name="twitter:image")/i,
    // Apple touch icon (often high quality)
    /<link\s+rel="apple-touch-icon"\s+href="([^"]+)"/i
  ];
  
  for (const pattern of imagePriorities) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim()) {
      metadata.imageUrl = resolveUrl(match[1].trim(), sourceUrl);
      break;
    }
  }
  
  // If no image found yet, try to find meaningful images
  if (!metadata.imageUrl) {
    // Try to find the first meaningful image
    const imgMatches = html.match(/<img[^>]+src="([^">]+)"/ig);
    if (imgMatches && imgMatches.length > 0) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src="([^">]+)"/i);
        if (srcMatch && srcMatch[1]) {
          // Filter out tiny images, icons, avatars, etc.
          const isLikelyIcon = 
            srcMatch[1].includes('icon') ||
            srcMatch[1].includes('logo') || 
            srcMatch[1].includes('avatar') || 
            srcMatch[1].includes('favicon');
          
          if (!isLikelyIcon) {
            metadata.imageUrl = resolveUrl(srcMatch[1], sourceUrl);
            break;
          }
        }
      }
    }
  }
  
  // Generate tags with improved strategies
  // 1. Try keywords meta tag
  const keywordsMatch = html.match(/<meta\s+(?:name="keywords"|property="article:tag")\s+content="(.*?)"/i);
  let tags: string[] = [];
  
  if (keywordsMatch && keywordsMatch[1]) {
    tags = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  
  // 2. Extract from the content
  const cleanedContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  
  // Common categories as potential tags (extended list)
  const potentialCategories = [
    // Tech & Development
    "technology", "programming", "coding", "web development", "frontend", "backend", 
    "javascript", "react", "vue", "angular", "node.js", "typescript", "python", "java",
    "mobile app", "development", "software", "engineering", "devops", "api", "cloud",
    
    // Design & Creative
    "design", "ui", "ux", "user interface", "user experience", "graphic design", 
    "illustration", "animation", "3d", "typography", "branding", "logo", "mockup", 
    "prototype", "figma", "adobe", "creative",
    
    // Business & Marketing
    "business", "startup", "marketing", "analytics", "seo", "advertising", "social media", 
    "sales", "e-commerce", "ecommerce", "finance", "investment", "strategy", 
    "entrepreneurship", "management", "leadership",
    
    // Health & Lifestyle
    "health", "fitness", "nutrition", "wellness", "diet", "workout", "exercise", "yoga",
    "meditation", "mindfulness", "mental health", "lifestyle", "self-improvement", 
    "productivity", "habits",
    
    // Food & Travel
    "food", "recipe", "cooking", "baking", "cuisine", "restaurant", "travel", 
    "destination", "tourism", "vacation", "adventure", "photography", "nature",
    
    // Education & Knowledge
    "education", "learning", "tutorial", "course", "training", "skill", "knowledge",
    "science", "research", "history", "culture", "language", "book", "literature", 
    
    // News & Entertainment
    "news", "entertainment", "media", "music", "movie", "film", "tv", "television", 
    "game", "gaming", "video", "podcast", "streaming", "celebrity", "fashion"
  ];
  
  // URL-based tags
  let urlTags: string[] = [];
  try {
    const urlObj = new URL(sourceUrl);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Add domain name as a tag
    const domainTag = domain.split('.')[0];
    if (domainTag && domainTag.length > 1) {
      urlTags.push(domainTag);
    }
    
    // Add path segments as potential tags
    const pathSegments = urlObj.pathname
      .split('/')
      .filter(segment => 
        segment.length > 2 && 
        !segment.includes('.') && 
        !['index', 'page', 'post', 'article'].includes(segment)
      );
      
    urlTags = [...urlTags, ...pathSegments];
  } catch (e) {
    console.error("Error parsing URL for tags:", e);
  }
  
  // Content-based tags - find categories in the content
  const contentTags = potentialCategories
    .filter(tag => cleanedContent.includes(tag.toLowerCase()))
    .slice(0, 10);
  
  // Look for H1 and H2 headings for potential tags
  const headingMatches = html.matchAll(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi);
  const headingTags: string[] = [];
  
  if (headingMatches) {
    for (const match of headingMatches) {
      if (match[1]) {
        const heading = match[1].replace(/<[^>]+>/g, '').trim();
        const words = heading.split(/\s+/).filter(word => word.length > 3);
        
        if (words.length > 0) {
          headingTags.push(...words.slice(0, 3)); // Take up to 3 words from each heading
        }
      }
    }
  }

  // Combine all tag sources and deduplicate
  const combinedTags = [
    ...tags, 
    ...contentTags,
    ...urlTags,
    ...headingTags
  ]
  .map(tag => tag.toLowerCase().trim())
  .filter((tag, index, self) => 
    tag.length > 2 && // Minimum tag length
    !/^\d+$/.test(tag) && // Filter out purely numeric tags
    self.indexOf(tag) === index // Deduplicate
  );
  
  // Take the most relevant tags (up to 10)
  metadata.tags = combinedTags.slice(0, 10);
  
  // Make sure we have at least one tag
  if (metadata.tags.length === 0 && urlTags.length > 0) {
    metadata.tags = urlTags.slice(0, 3);
  }

  // If still no tags, use domain as fallback
  if (metadata.tags.length === 0) {
    try {
      const domain = new URL(sourceUrl).hostname.replace('www.', '').split('.')[0];
      if (domain) {
        metadata.tags.push(domain);
      }
    } catch (e) {
      console.error("Error parsing URL for fallback tag:", e);
    }
  }
  
  return metadata;
}

function resolveUrl(url: string, base: string): string {
  try {
    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Handle protocol-relative URLs (//example.com/image.jpg)
    if (url.startsWith('//')) {
      const baseUrl = new URL(base);
      return `${baseUrl.protocol}${url}`;
    }
    
    return new URL(url, base).href;
  } catch (e) {
    console.error("Error resolving URL:", e);
    return url;
  }
}
