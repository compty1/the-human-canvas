import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// This function checks for scheduled content and publishes it
// It should be called periodically (e.g., via cron job or webhook)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const publishedItems: { type: string; title: string }[] = [];

    // Check and publish articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, title")
      .eq("review_status", "scheduled")
      .lte("scheduled_at", now);

    if (!articlesError && articles?.length) {
      for (const article of articles) {
        await supabase
          .from("articles")
          .update({ review_status: "published", published: true })
          .eq("id", article.id);
        publishedItems.push({ type: "article", title: article.title });
      }
    }

    // Check and publish updates
    const { data: updates, error: updatesError } = await supabase
      .from("updates")
      .select("id, title")
      .eq("review_status", "scheduled")
      .lte("scheduled_at", now);

    if (!updatesError && updates?.length) {
      for (const update of updates) {
        await supabase
          .from("updates")
          .update({ review_status: "published", published: true })
          .eq("id", update.id);
        publishedItems.push({ type: "update", title: update.title });
      }
    }

    // Check and publish product reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("product_reviews")
      .select("id, product_name")
      .eq("review_status", "scheduled")
      .lte("scheduled_at", now);

    if (!reviewsError && reviews?.length) {
      for (const review of reviews) {
        await supabase
          .from("product_reviews")
          .update({ review_status: "published", published: true })
          .eq("id", review.id);
        publishedItems.push({ type: "product_review", title: review.product_name });
      }
    }

    // Log the publishing activity
    if (publishedItems.length > 0) {
      await supabase.from("admin_activity_log").insert({
        action: "scheduled_publish",
        entity_type: "content",
        details: {
          published_count: publishedItems.length,
          items: publishedItems,
          executed_at: now,
        },
      });
    }

    console.log(`Scheduled publisher: Published ${publishedItems.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        published_count: publishedItems.length,
        items: publishedItems,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scheduled publisher error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
