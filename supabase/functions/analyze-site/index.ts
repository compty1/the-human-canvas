import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeSiteRequest {
  url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url }: AnalyzeSiteRequest = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch the website HTML
    let html = "";
    try {
      const siteResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PortfolioAnalyzer/1.0)",
        },
      });
      html = await siteResponse.text();
    } catch (error) {
      console.error("Error fetching site:", error);
      throw new Error("Could not fetch the website");
    }

    // Extract basic metadata from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    
    // Extract colors (simplified - looks for hex codes)
    const colorMatches = html.match(/#[0-9A-Fa-f]{6}/g) || [];
    const uniqueColors = [...new Set(colorMatches)].slice(0, 10);

    // Detect common technologies
    const techStack: string[] = [];
    if (html.includes("react") || html.includes("React")) techStack.push("React");
    if (html.includes("vue") || html.includes("Vue")) techStack.push("Vue.js");
    if (html.includes("angular") || html.includes("Angular")) techStack.push("Angular");
    if (html.includes("tailwind") || html.includes("Tailwind")) techStack.push("Tailwind CSS");
    if (html.includes("bootstrap") || html.includes("Bootstrap")) techStack.push("Bootstrap");
    if (html.includes("next") || html.includes("Next")) techStack.push("Next.js");
    if (html.includes("wordpress") || html.includes("WordPress")) techStack.push("WordPress");
    if (html.includes("shopify") || html.includes("Shopify")) techStack.push("Shopify");

    // Use AI to generate comprehensive analysis
    const analysisPrompt = `Analyze this website and generate a portfolio entry. 
    
URL: ${url}
Title: ${titleMatch?.[1] || "Unknown"}
Description: ${descriptionMatch?.[1] || "No description found"}
Detected Technologies: ${techStack.join(", ") || "Unknown"}

Based on the website metadata and any information you can infer from the URL and title, generate:

1. A compelling project title (if the extracted title isn't good)
2. A short description (1-2 sentences)
3. A long description (2-3 paragraphs) explaining the project
4. Key features (list of 5-8 features)
5. A problem statement (what problem does this solve?)
6. A solution summary (how does it solve it?)
7. Technology stack analysis

Format your response as JSON with these fields:
{
  "title": "",
  "shortDescription": "",
  "longDescription": "",
  "features": [],
  "problemStatement": "",
  "solutionSummary": "",
  "techStack": [],
  "suggestedTags": []
}`;

    let analysis: Record<string, unknown> = {};
    
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { 
              role: "system", 
              content: "You are a portfolio content generator. Generate compelling, professional content for project entries. Always respond with valid JSON." 
            },
            { role: "user", content: analysisPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI Gateway error:", aiResponse.status, errorText);
        // Continue with empty analysis instead of throwing
      } else {
        const responseText = await aiResponse.text();
        console.log("AI response text length:", responseText.length);
        
        if (responseText && responseText.trim()) {
          try {
            const aiData = JSON.parse(responseText);
            const aiContent = aiData.choices?.[0]?.message?.content || "{}";
            
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
          }
        }
      }
    } catch (aiError) {
      console.error("AI request failed:", aiError);
      // Continue with empty analysis
    }

    // Return response with fields matching ProjectEditor form exactly
    return new Response(
      JSON.stringify({
        success: true,
        url,
        // Top-level fields for direct form mapping in ProjectEditor
        title: (analysis.title as string) || titleMatch?.[1] || parsedUrl.hostname,
        description: (analysis.shortDescription as string) || descriptionMatch?.[1] || "",
        long_description: (analysis.longDescription as string) || "",
        tech_stack: Array.isArray(analysis.techStack) && analysis.techStack.length > 0 ? analysis.techStack : techStack,
        features: Array.isArray(analysis.features) ? analysis.features : [],
        problem_statement: (analysis.problemStatement as string) || "",
        solution_summary: (analysis.solutionSummary as string) || "",
        // Additional metadata
        metadata: {
          title: titleMatch?.[1] || (analysis.title as string) || parsedUrl.hostname,
          description: descriptionMatch?.[1] || "",
          ogImage: ogImageMatch?.[1] || null,
        },
        colorPalette: uniqueColors,
        detectedTech: techStack,
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing site:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
