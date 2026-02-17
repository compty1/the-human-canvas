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
    // Auth check (issue #380)
    if (!(await verifyAdmin(req))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const publishedItems: { type: string; title: string }[] = [];

    // Publish articles
    const { data: articles } = await supabase
      .from("articles").select("id, title")
      .eq("review_status", "scheduled").lte("scheduled_at", now);
    if (articles?.length) {
      for (const article of articles) {
        await supabase.from("articles").update({ review_status: "published", published: true }).eq("id", article.id);
        publishedItems.push({ type: "article", title: article.title });
      }
    }

    // Publish updates
    const { data: updates } = await supabase
      .from("updates").select("id, title")
      .eq("review_status", "scheduled").lte("scheduled_at", now);
    if (updates?.length) {
      for (const update of updates) {
        await supabase.from("updates").update({ review_status: "published", published: true }).eq("id", update.id);
        publishedItems.push({ type: "update", title: update.title });
      }
    }

    // Publish product reviews
    const { data: reviews } = await supabase
      .from("product_reviews").select("id, product_name")
      .eq("review_status", "scheduled").lte("scheduled_at", now);
    if (reviews?.length) {
      for (const review of reviews) {
        await supabase.from("product_reviews").update({ review_status: "published", published: true }).eq("id", review.id);
        publishedItems.push({ type: "product_review", title: review.product_name });
      }
    }

    if (publishedItems.length > 0) {
      await supabase.from("admin_activity_log").insert({
        action: "scheduled_publish", entity_type: "content",
        details: { published_count: publishedItems.length, items: publishedItems, executed_at: now },
      });
    }

    return new Response(JSON.stringify({
      success: true, published_count: publishedItems.length, items: publishedItems,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Scheduled publisher error:", error);
    return new Response(JSON.stringify({
      success: false, error: "An internal error occurred.",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
