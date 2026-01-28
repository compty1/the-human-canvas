import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateCopyRequest {
  contentType?: string;
  type?: string;
  context?: string;
  existingContent?: string;
  tone?: "professional" | "creative" | "casual" | "technical";
  length?: "brief" | "standard" | "detailed" | "short";
  variations?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateCopyRequest = await req.json();
    const { 
      contentType, 
      type, 
      context, 
      existingContent, 
      tone = "professional", 
      length = "standard", 
      variations = 1 
    } = body;

    // Support both 'contentType' and 'type' field names
    const actualType = contentType || type || "general";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lengthGuide: Record<string, string> = {
      brief: "Keep it concise, 1-2 sentences.",
      short: "Keep it concise, 1-2 sentences.",
      standard: "Write 2-3 paragraphs.",
      detailed: "Write a comprehensive piece with 4-5 paragraphs.",
    };

    const toneGuide: Record<string, string> = {
      professional: "Use a professional, polished tone suitable for a portfolio.",
      creative: "Use a creative, artistic tone that shows personality.",
      casual: "Use a friendly, approachable casual tone.",
      technical: "Use a technical, precise tone suitable for developers.",
    };

    const contentGuides: Record<string, string> = {
      project: "Write compelling copy for a portfolio project. Highlight the problem solved, technology used, and results achieved.",
      project_description: "Write compelling copy for a portfolio project. Highlight the problem solved, technology used, and results achieved.",
      article: "Write engaging copy for a blog article or essay. Focus on the narrative and key insights.",
      article_excerpt: "Write an engaging excerpt for a blog article. Hook the reader and summarize key points.",
      update: "Write a short, engaging update or quick note. Keep it personal and informative.",
      update_post: "Write a short, engaging update or quick note. Keep it personal and informative.",
      artwork: "Write descriptive copy for artwork. Capture the emotion, technique, and story behind the piece.",
      artwork_description: "Write descriptive copy for artwork. Capture the emotion, technique, and story behind the piece.",
      about: "Write biographical copy that showcases personality, skills, and passion.",
      about_section: "Write biographical copy that showcases personality, skills, and passion.",
      product_review: "Write a thoughtful product review. Cover strengths, weaknesses, and recommendations.",
      custom: "Write copy that fits the context provided.",
      general: "Write copy that fits the context provided.",
    };

    const systemPrompt = `You are a skilled copywriter for a creative portfolio website. Your writing style is bold, engaging, and authentic. 
    
The portfolio owner is interested in photography, digital art, pop art style, UX design, web development, and views culture as "future artifacts of humanity."

${contentGuides[actualType] || contentGuides.general}
${toneGuide[tone] || toneGuide.professional}
${lengthGuide[length] || lengthGuide.standard}

${variations > 1 ? `Generate ${variations} different variations, separated by "---VARIATION---"` : ""}`;

    const userPrompt = existingContent 
      ? `Improve or rewrite this existing content:\n\n${existingContent}\n\n${context ? `Additional context: ${context}` : ""}`
      : `Write ${actualType} copy. ${context ? `Context: ${context}` : "Generate fresh, engaging content."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    // Split variations if requested
    const results = variations > 1 
      ? generatedContent.split("---VARIATION---").map((v: string) => v.trim()).filter(Boolean)
      : [generatedContent.trim()];

    return new Response(
      JSON.stringify({ 
        success: true, 
        // Return both 'results' and 'variations' for compatibility with different consumers
        results,
        variations: results,
        // Single content for simpler use cases
        content: results[0],
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating copy:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
