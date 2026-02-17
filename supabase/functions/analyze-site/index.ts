import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    if (!url) throw new Error("URL is required");

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { throw new Error("Invalid URL format"); }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    let html = "";
    try {
      const siteResponse = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioAnalyzer/1.0)" } });
      html = await siteResponse.text();
    } catch { throw new Error("Could not fetch the website"); }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    
    const appleTouchIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    let logoUrl = appleTouchIconMatch?.[1] || faviconMatch?.[1];
    if (logoUrl && !logoUrl.startsWith("http")) logoUrl = new URL(logoUrl, url).href;
    if (!logoUrl) logoUrl = new URL("/favicon.ico", url).href;

    const colorMatches = html.match(/#[0-9A-Fa-f]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)].slice(0, 10);

    const techStack: string[] = [];
    if (html.includes("react") || html.includes("React")) techStack.push("React");
    if (html.includes("vue") || html.includes("Vue")) techStack.push("Vue.js");
    if (html.includes("tailwind") || html.includes("Tailwind")) techStack.push("Tailwind CSS");
    if (html.includes("next") || html.includes("Next")) techStack.push("Next.js");

    let analysis: Record<string, unknown> = {};
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Generate portfolio project content as valid JSON with: title, shortDescription, longDescription, features[], problemStatement, solutionSummary, techStack[], suggestedTags[]" },
            { role: "user", content: `Analyze: URL: ${url}, Title: ${titleMatch?.[1] || "Unknown"}, Description: ${descriptionMatch?.[1] || "None"}, Tech: ${techStack.join(", ")}` },
          ],
        }),
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || "{}";
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return new Response(JSON.stringify({
      success: true, url,
      title: (analysis.title as string) || titleMatch?.[1] || parsedUrl.hostname,
      description: (analysis.shortDescription as string) || descriptionMatch?.[1] || "",
      long_description: (analysis.longDescription as string) || "",
      tech_stack: Array.isArray(analysis.techStack) && analysis.techStack.length > 0 ? analysis.techStack : techStack,
      features: Array.isArray(analysis.features) ? analysis.features : [],
      problem_statement: (analysis.problemStatement as string) || "",
      solution_summary: (analysis.solutionSummary as string) || "",
      logo_url: logoUrl,
      metadata: { title: titleMatch?.[1] || parsedUrl.hostname, description: descriptionMatch?.[1] || "", ogImage: ogImageMatch?.[1] || null, logo: logoUrl },
      colorPalette: uniqueColors, detectedTech: techStack, analysis,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error analyzing site:", error);
    return new Response(JSON.stringify({
      success: false, error: "An internal error occurred. Please try again.",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
