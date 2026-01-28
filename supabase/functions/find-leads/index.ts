import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FindLeadsRequest {
  industry?: string;
  location?: string;
  companySize?: string;
  keywords?: string[];
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claims.claims.sub;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { industry, location, companySize, keywords, limit = 20 }: FindLeadsRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to generate relevant leads based on the portfolio owner's profile
    const leadPrompt = `Generate a list of ${limit} potential business leads for a creative professional with these skills:
- Web Development (React, TypeScript, UX Design)
- Digital Art & Illustration
- Photography
- Graphic Design (product design, stickers)
- Content Writing & Journalism
- Type 1 Diabetes advocacy

Search criteria:
${industry ? `- Industry: ${industry}` : "- Industries: Tech startups, Creative agencies, Health/Wellness, Small businesses"}
${location ? `- Location: ${location}` : "- Location: Remote-friendly, US-based preferred"}
${companySize ? `- Company size: ${companySize}` : "- Company size: 1-50 employees (small businesses, startups)"}
${keywords?.length ? `- Keywords: ${keywords.join(", ")}` : ""}

For each lead, provide:
1. Company name
2. Industry
3. Estimated company size
4. Location (city, state/country)
5. Why they might need my services (match reasons)
6. Match score (0-100) based on alignment with my skills
7. Suggested services to pitch
8. A plausible website URL
9. A plausible LinkedIn company page URL

Format as JSON array:
[{
  "name": "Company Name",
  "company": "Company Name", 
  "industry": "Industry",
  "company_size": "1-10",
  "location": "City, State",
  "match_score": 85,
  "match_reasons": ["reason1", "reason2"],
  "suggested_services": ["Web Development", "UX Design"],
  "website": "https://example.com",
  "linkedin": "https://linkedin.com/company/example"
}]

Make these realistic and relevant. Focus on companies that genuinely need creative/tech services.`;

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
            content: "You are a business development assistant. Generate realistic, relevant business leads. Always respond with valid JSON arrays.",
          },
          { role: "user", content: leadPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error(`AI lead generation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let leads;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      leads = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse leads:", content);
      leads = [];
    }

    // Log the search
    await supabase.from("lead_searches").insert({
      search_query: `${industry || "all"} - ${location || "any"} - ${companySize || "any"}`,
      filters: { industry, location, companySize, keywords },
      results_count: leads.length,
      status: "completed",
    });

    return new Response(
      JSON.stringify({
        success: true,
        leads,
        count: leads.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error finding leads:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
