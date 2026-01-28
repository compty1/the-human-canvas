import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CaptureResult {
  screenshots: string[];
  og_image: string | null;
  twitter_image: string | null;
  favicon: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the page to extract images
    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      if (response.ok) {
        html = await response.text();
      } else {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to fetch page:", e);
      return new Response(
        JSON.stringify({ error: "Failed to fetch the URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = new URL(url);
    const makeAbsolute = (src: string): string | null => {
      if (!src) return null;
      try {
        if (src.startsWith("//")) {
          return `https:${src}`;
        }
        if (src.startsWith("http")) {
          return src;
        }
        if (src.startsWith("/")) {
          return `${baseUrl.origin}${src}`;
        }
        return `${baseUrl.origin}/${src}`;
      } catch {
        return null;
      }
    };

    // Extract Open Graph image
    let ogImage: string | null = null;
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) {
      ogImage = makeAbsolute(ogMatch[1]);
    }

    // Extract Twitter image
    let twitterImage: string | null = null;
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twitterMatch) {
      twitterImage = makeAbsolute(twitterMatch[1]);
    }

    // Extract favicon
    let favicon: string | null = null;
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (faviconMatch) {
      favicon = makeAbsolute(faviconMatch[1]);
    }

    // Extract all images from the page
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
    const allImages: string[] = [];
    
    for (const match of imgMatches) {
      const src = makeAbsolute(match[1]);
      if (src) {
        allImages.push(src);
      }
    }

    // Also look for background images in style attributes
    const bgMatches = html.matchAll(/background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)/gi);
    for (const match of bgMatches) {
      const src = makeAbsolute(match[1]);
      if (src) {
        allImages.push(src);
      }
    }

    // Filter out small images (icons, tracking pixels, etc)
    const filteredImages: string[] = [];
    const seen = new Set<string>();
    
    for (const imgUrl of allImages) {
      if (seen.has(imgUrl)) continue;
      seen.add(imgUrl);
      
      // Skip data URIs, tiny images, and common non-screenshot patterns
      if (imgUrl.startsWith("data:")) continue;
      if (imgUrl.includes("favicon")) continue;
      if (imgUrl.includes("icon")) continue;
      if (imgUrl.includes("logo") && !imgUrl.includes("screenshot")) continue;
      if (imgUrl.includes("avatar")) continue;
      if (imgUrl.includes("emoji")) continue;
      if (imgUrl.includes("pixel")) continue;
      if (imgUrl.includes("tracking")) continue;
      if (imgUrl.includes("analytics")) continue;
      if (imgUrl.match(/1x1|\.gif$/i)) continue;
      if (imgUrl.match(/\.(svg)$/i)) continue;
      
      // Check image dimensions by trying to parse width/height from HTML
      // This is a heuristic - actual validation would require fetching images
      filteredImages.push(imgUrl);
    }

    // Prioritize likely screenshot images
    const prioritized = filteredImages.sort((a, b) => {
      const scoreA = 
        (a.includes("screenshot") ? 10 : 0) +
        (a.includes("preview") ? 8 : 0) +
        (a.includes("hero") ? 7 : 0) +
        (a.includes("demo") ? 6 : 0) +
        (a.includes("feature") ? 5 : 0) +
        (a.includes("product") ? 4 : 0);
      const scoreB = 
        (b.includes("screenshot") ? 10 : 0) +
        (b.includes("preview") ? 8 : 0) +
        (b.includes("hero") ? 7 : 0) +
        (b.includes("demo") ? 6 : 0) +
        (b.includes("feature") ? 5 : 0) +
        (b.includes("product") ? 4 : 0);
      return scoreB - scoreA;
    });

    // Return top images, prioritizing OG and Twitter images
    const screenshots: string[] = [];
    
    if (ogImage && !seen.has(ogImage)) {
      screenshots.push(ogImage);
    }
    if (twitterImage && twitterImage !== ogImage && !seen.has(twitterImage)) {
      screenshots.push(twitterImage);
    }
    
    // Add up to 6 more from page images
    for (const img of prioritized) {
      if (screenshots.length >= 8) break;
      if (!screenshots.includes(img)) {
        screenshots.push(img);
      }
    }

    const result: CaptureResult = {
      screenshots,
      og_image: ogImage,
      twitter_image: twitterImage,
      favicon,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("capture-screenshots error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
