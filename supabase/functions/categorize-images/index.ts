import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
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

    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Process in batches of 5
    const batchSize = 5;
    const allResults: Array<{ url: string; tags: string[] }> = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const urlList = batch.map((u: string, idx: number) => `${idx + 1}. ${u}`).join("\n");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an image categorization assistant. Given image URLs, analyze them and return descriptive category tags for each. Tags should be lowercase single words or short phrases like: logo, screenshot, portrait, landscape, product-photo, illustration, icon, texture, pattern, food, nature, architecture, abstract, ui-design, mockup, branding, photography, collage, artwork, sketch.",
            },
            {
              role: "user",
              content: `Categorize these images and return tags for each:\n${urlList}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "categorize_images",
                description: "Return category tags for each image URL",
                parameters: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          url: { type: "string" },
                          tags: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: ["url", "tags"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["results"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "categorize_images" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        allResults.push(...(parsed.results || []));
      }
    }

    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});