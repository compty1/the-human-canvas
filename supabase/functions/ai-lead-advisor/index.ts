import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AILeadAdvisorRequest {
  messages: Message[];
  leadContext?: string;
  planContext?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, leadContext, planContext }: AILeadAdvisorRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an experienced business development advisor helping a creative professional evaluate and pursue leads.

Your expertise includes:
- Evaluating business opportunities and partnerships
- Pricing strategies for freelance/contract work
- Negotiation tactics and best practices
- Project planning and timeline estimation
- Client communication strategies
- Identifying red flags in potential deals

The professional you're advising has these skills:
- Web Development (React, TypeScript, UX Design)
- Digital Art & Illustration  
- Photography
- Graphic Design
- Content Writing & Journalism
- Type 1 Diabetes advocacy

${leadContext ? `Current Lead Context:\n${leadContext}` : ""}
${planContext ? `Current Plan Context:\n${planContext}` : ""}

Provide:
- Actionable advice specific to the lead/opportunity
- Concrete suggestions for pricing, timeline, or approach
- Potential concerns or questions to ask
- Next steps to move forward

Be direct and practical. Give specific numbers when discussing pricing or timelines.`;

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
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI Gateway error: ${status}`);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Lead Advisor error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
