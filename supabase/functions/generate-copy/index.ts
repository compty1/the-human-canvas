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
  fields?: string[];
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
      variations = 1,
      fields = []
    } = body;

    const actualType = contentType || type || "general";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle bulk import with enhanced extraction
    if (actualType === "bulk_import" && context && fields.length > 0) {
      console.log(`Bulk import: Processing ${context.length} characters for fields: ${fields.join(", ")}`);
      
      const extractionPrompt = `You are a data extraction expert. Analyze the following text and extract information for these specific fields: ${fields.join(", ")}.

TEXT TO ANALYZE:
${context}

EXTRACTION RULES:
1. For array fields (tech_stack, features, tags, skills_demonstrated, lessons_learned, products_offered, themes, influence_areas, etc.), return arrays of strings
2. For text fields (title, description, long_description, content, case_study, etc.), return strings
3. For number fields (revenue, costs, etc.), return numbers only (no currency symbols)
4. If a field cannot be determined from the text, omit it entirely
5. Be thorough - extract as much relevant information as possible
6. For case_study field, create a comprehensive narrative if enough information is available
7. For description fields, summarize the key points concisely
8. For long_description or detailed_content, preserve more detail and structure

Return ONLY valid JSON with the extracted values. No markdown, no explanations, just the JSON object.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "You are a precise data extraction assistant. Extract structured information from text and return it as valid JSON only. Never include markdown formatting or explanations." 
            },
            { role: "user", content: extractionPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        console.error(`AI Gateway error ${status}:`, errorText);
        
        if (status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded. Please wait and try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: "Payment required. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`AI Gateway error: ${status}`);
      }

      const data = await response.json();
      const extractedContent = data.choices?.[0]?.message?.content || "{}";
      
      let extracted = {};
      try {
        // Clean up common JSON formatting issues
        const cleanedContent = extractedContent
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .replace(/^[\s\n]*/, "")
          .replace(/[\s\n]*$/, "")
          .trim();
        
        extracted = JSON.parse(cleanedContent);
        console.log("Successfully extracted fields:", Object.keys(extracted));
      } catch (parseError) {
        console.error("Initial parse failed, attempting recovery:", parseError);
        
        // Try to find JSON object in response
        const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            extracted = JSON.parse(jsonMatch[0]);
            console.log("Recovery parse successful, fields:", Object.keys(extracted));
          } catch {
            console.error("Recovery parse also failed");
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          extracted,
          usage: data.usage 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard copy generation
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
      const status = response.status;
      const errorText = await response.text();
      console.error(`AI Gateway error ${status}:`, errorText);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    const results = variations > 1 
      ? generatedContent.split("---VARIATION---").map((v: string) => v.trim()).filter(Boolean)
      : [generatedContent.trim()];

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        variations: results,
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
