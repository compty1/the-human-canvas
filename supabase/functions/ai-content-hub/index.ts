import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI content management assistant for a personal portfolio/creative website. You help the admin manage all site content including articles, projects, updates, artwork, experiments, favorites, inspirations, experiences, certifications, client projects, skills, and products.

You have access to the current site content provided in each message. When asked to make changes, you MUST use the content_plan tool to return structured action plans.

IMPORTANT RULES:
- Always reference existing content by its real ID when updating or deleting
- When creating new content, generate appropriate slugs from titles (lowercase, hyphenated)
- Never modify content that wasn't explicitly discussed
- Each action in a plan must specify the exact table, fields, and values
- For updates, only include the fields that are changing
- When the user pastes content, analyze it and suggest the best content type and fields
- Be specific about what will change - show field names and values
- Required fields by table:
  - articles: title, slug, category (philosophy|narrative|cultural|ux_review|research|metaphysics)
  - projects: title, slug
  - updates: title, slug
  - artwork: title, image_url
  - experiments: name, slug, platform, status
  - favorites: title, type
  - inspirations: title, category
  - experiences: title, slug, category
  - certifications: name, issuer
  - client_projects: project_name, client_name, slug, status
  - skills: (check existing schema)
  - products: name, slug, price

When analyzing pasted content, suggest:
1. Which content type it fits best
2. Suggested field values (title, description, tags, category, etc.)
3. A structured plan to create it

Always provide clear summaries of what each plan will do.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, siteContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextMessage = siteContent
      ? `\n\nCURRENT SITE CONTENT SUMMARY:\n${JSON.stringify(siteContent, null, 2)}`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: SYSTEM_PROMPT + contextMessage,
            },
            ...messages,
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "content_plan",
                description:
                  "Create a structured plan to modify site content. Use this whenever the user asks to create, update, or delete any content.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Short title for this plan",
                    },
                    summary: {
                      type: "string",
                      description:
                        "Human-readable summary of what this plan will do",
                    },
                    actions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            enum: ["create", "update", "delete"],
                          },
                          table: {
                            type: "string",
                            description: "Database table name",
                          },
                          record_id: {
                            type: "string",
                            description:
                              "UUID of existing record (for update/delete)",
                          },
                          data: {
                            type: "object",
                            description:
                              "Fields and values to set",
                          },
                          description: {
                            type: "string",
                            description:
                              "Human-readable description of this action",
                          },
                        },
                        required: ["type", "table", "description"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["title", "summary", "actions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-content-hub error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
