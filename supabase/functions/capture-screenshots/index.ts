import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return !!isAdmin;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!(await verifyAdmin(req))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL to prevent SSRF (issue #381)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let html = "";
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioAnalyzer/1.0)" },
      });
      if (response.ok) {
        html = await response.text();
      } else {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to fetch the URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = new URL(url);
    const makeAbsolute = (src: string): string | null => {
      if (!src) return null;
      try {
        if (src.startsWith("//")) return `https:${src}`;
        if (src.startsWith("http")) return src;
        if (src.startsWith("/")) return `${baseUrl.origin}${src}`;
        return `${baseUrl.origin}/${src}`;
      } catch { return null; }
    };

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const ogImage = ogMatch ? makeAbsolute(ogMatch[1]) : null;

    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    const twitterImage = twitterMatch ? makeAbsolute(twitterMatch[1]) : null;

    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    const favicon = faviconMatch ? makeAbsolute(faviconMatch[1]) : null;

    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
    const allImages: string[] = [];
    for (const match of imgMatches) {
      const src = makeAbsolute(match[1]);
      if (src) allImages.push(src);
    }

    const seen = new Set<string>();
    const filteredImages: string[] = [];
    for (const imgUrl of allImages) {
      if (seen.has(imgUrl)) continue;
      seen.add(imgUrl);
      if (imgUrl.startsWith("data:") || imgUrl.includes("favicon") || imgUrl.includes("icon") ||
          imgUrl.includes("avatar") || imgUrl.includes("emoji") || imgUrl.includes("pixel") ||
          imgUrl.includes("tracking") || imgUrl.includes("analytics") ||
          imgUrl.match(/1x1|\.gif$/i) || imgUrl.match(/\.(svg)$/i)) continue;
      filteredImages.push(imgUrl);
    }

    const screenshots: string[] = [];
    if (ogImage) screenshots.push(ogImage);
    if (twitterImage && twitterImage !== ogImage) screenshots.push(twitterImage);
    for (const img of filteredImages) {
      if (screenshots.length >= 8) break;
      if (!screenshots.includes(img)) screenshots.push(img);
    }

    return new Response(
      JSON.stringify({ screenshots, og_image: ogImage, twitter_image: twitterImage, favicon }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("capture-screenshots error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
