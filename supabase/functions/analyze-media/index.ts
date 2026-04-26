import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      return new Response(
        JSON.stringify({ error: 'No URLs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 10 images per request
    const limitedUrls = urls.slice(0, 10);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const url of limitedUrls) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this image and return a JSON object with these fields:
- "description": A detailed 2-3 sentence description of the image content, style, and mood
- "alt_text": A concise alt text for accessibility (under 125 characters)
- "details": Additional visual details like colors, composition, subject matter, medium/style
- "suggested_tags": An array of 3-6 relevant tags for categorization

Return ONLY valid JSON, no markdown or extra text.`
                  },
                  {
                    type: 'image_url',
                    image_url: { url }
                  }
                ]
              }
            ],
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error(`AI API error for ${url}: ${response.status}`);
          results.push({ url, error: 'Analysis failed' });
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response (handle markdown code blocks)
        let parsed;
        try {
          const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(jsonStr);
        } catch {
          parsed = { description: content, alt_text: '', details: '', suggested_tags: [] };
        }

        results.push({
          url,
          description: parsed.description || '',
          alt_text: parsed.alt_text || '',
          details: parsed.details || '',
          suggested_tags: parsed.suggested_tags || [],
        });
      } catch (err) {
        console.error(`Error analyzing ${url}:`, err);
        results.push({ url, error: 'Analysis failed' });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analyze media error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
