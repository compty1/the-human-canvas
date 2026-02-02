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
  leadType?: "work" | "partnership" | "organization";
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { industry, location, companySize, keywords, leadType = "work", limit = 20 }: FindLeadsRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different prompts based on lead type
    const leadTypePrompts: Record<string, string> = {
      work: `Generate ${limit} potential WORK/GIG leads - companies that might hire for freelance or contract work:
- Focus on companies needing web development, design, or creative services
- Include estimated pay ranges for typical projects
- Suggest specific services to pitch based on the company's needs`,
      
      partnership: `Generate ${limit} potential PARTNERSHIP leads - companies or creators to collaborate with:
- Focus on complementary businesses, influencers, or creators
- Include mutual benefits of partnership
- Suggest collaboration ideas and joint venture opportunities`,
      
      organization: `Generate ${limit} potential ORGANIZATION leads - associations, communities, or groups to join:
- Focus on professional associations, creative communities, or advocacy groups
- Include membership benefits and networking opportunities
- Suggest ways to get involved and contribute`,
    };

    const leadPrompt = `${leadTypePrompts[leadType] || leadTypePrompts.work}

Portfolio owner skills:
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
1. Company/Organization name
2. Industry or category
3. Size (employees or members)
4. Location
5. Why they're a good match
6. Match score (0-100)
7. ${leadType === "work" ? "Estimated pay for typical project" : leadType === "partnership" ? "Partnership benefits" : "Membership benefits"}
8. ${leadType === "work" ? "Suggested services to pitch" : leadType === "partnership" ? "Collaboration ideas" : "Ways to get involved"}
9. Website URL (plausible)
10. LinkedIn URL (plausible)
${leadType === "work" ? "11. Work description - what they likely need done" : ""}
${leadType !== "work" ? "11. Contact person and title (if applicable)" : ""}

Format as JSON array:
[{
  "name": "Company/Org Name",
  "company": "Company/Org Name", 
  "industry": "Industry",
  "company_size": "1-10",
  "location": "City, State",
  "match_score": 85,
  "match_reasons": ["reason1", "reason2"],
  "estimated_pay": ${leadType === "work" ? "5000" : "null"},
  "suggested_services": ["Web Development", "UX Design"],
  "benefits": ${leadType !== "work" ? '["benefit1", "benefit2"]' : "null"},
  "work_description": ${leadType === "work" ? '"Brief description of work needed"' : "null"},
  "contact_person": ${leadType !== "work" ? '"John Smith"' : "null"},
  "contact_title": ${leadType !== "work" ? '"Partnership Manager"' : "null"},
  "website": "https://example.com",
  "linkedin": "https://linkedin.com/company/example",
  "lead_type": "${leadType}"
}]

Make these realistic and relevant. Focus on genuine opportunities.`;

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
            content: "You are a business development assistant. Generate realistic, relevant leads. Always respond with valid JSON arrays.",
          },
          { role: "user", content: leadPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
      search_query: `${leadType} - ${industry || "all"} - ${location || "any"} - ${companySize || "any"}`,
      filters: { industry, location, companySize, keywords, leadType },
      results_count: leads.length,
      status: "completed",
    });

    // Save the generated leads to the database
    if (leads.length > 0) {
      const leadsToInsert = leads.map((lead: Record<string, unknown>) => ({
        name: lead.name || null,
        company: lead.company || lead.name,
        industry: lead.industry || null,
        company_size: lead.company_size || null,
        location: lead.location || null,
        match_score: lead.match_score || null,
        match_reasons: lead.match_reasons || [],
        website: lead.website || null,
        linkedin: lead.linkedin || null,
        source: "ai_generated",
        status: "new",
        lead_type: lead.lead_type || leadType,
        estimated_pay: lead.estimated_pay || null,
        work_description: lead.work_description || null,
        benefits: lead.benefits || null,
        contact_person: lead.contact_person || null,
        contact_title: lead.contact_title || null,
        suggested_services: lead.suggested_services || null,
      }));

      const { error: insertError } = await supabase.from("leads").insert(leadsToInsert);
      if (insertError) {
        console.error("Failed to save leads:", insertError);
      }
    }

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
