import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export interface ContentAction {
  type: "create" | "update" | "delete";
  table: string;
  record_id?: string;
  data?: Record<string, unknown>;
  description: string;
}

export interface ContentPlan {
  id?: string;
  title: string;
  summary: string;
  actions: ContentAction[];
  status?: string;
  conversation_id?: string;
}

const ALLOWED_TABLES = [
  "articles", "updates", "projects", "artwork", "experiments",
  "favorites", "inspirations", "experiences", "certifications",
  "client_projects", "skills", "products", "product_reviews",
  "life_periods", "learning_goals", "funding_campaigns", "supplies_needed",
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

export function useContentActions() {
  const queryClient = useQueryClient();

  const insertPlan = async (fields: {
    title: string;
    description?: string;
    actions: unknown;
    status: string;
    executed_at?: string;
    conversation_id?: string | null;
  }) => {
    const { data, error } = await (supabase.from("ai_content_plans") as any)
      .insert(fields)
      .select()
      .single();
    return { data, error };
  };

  const executePlan = async (plan: ContentPlan): Promise<{ success: boolean; planId: string | null }> => {
    if (!plan.actions || plan.actions.length === 0) {
      toast({ title: "No actions to execute", variant: "destructive" });
      return { success: false, planId: null };
    }

    // Save plan to DB
    const { data: savedPlan, error: planError } = await insertPlan({
        title: plan.title,
        description: plan.summary,
        actions: plan.actions as unknown as Record<string, unknown>,
        status: "executed",
        executed_at: new Date().toISOString(),
        conversation_id: plan.conversation_id || null,
      });

    if (planError || !savedPlan) {
      console.error("Failed to save plan:", planError);
      toast({ title: "Failed to save plan", variant: "destructive" });
      return { success: false, planId: null };
    }

    let allSuccess = true;

    for (const action of plan.actions) {
      if (!isAllowedTable(action.table)) {
        console.error(`Table ${action.table} not allowed`);
        allSuccess = false;
        continue;
      }

      try {
        if (action.type === "create") {
          const { data: created, error } = await (supabase.from(action.table) as any)
            .insert(action.data || {})
            .select()
            .single();

          if (error) throw error;

          await supabase.from("ai_change_history").insert({
            plan_id: savedPlan.id,
            action_type: "create",
            table_name: action.table,
            record_id: created.id,
            new_data: created,
          });
        } else if (action.type === "update" && action.record_id) {
          // Snapshot before
          const { data: existing } = await (supabase.from(action.table) as any)
            .select("*")
            .eq("id", action.record_id)
            .maybeSingle();

          const { data: updated, error } = await (supabase.from(action.table) as any)
            .update(action.data || {})
            .eq("id", action.record_id)
            .select()
            .single();

          if (error) throw error;

          await supabase.from("ai_change_history").insert({
            plan_id: savedPlan.id,
            action_type: "update",
            table_name: action.table,
            record_id: action.record_id,
            previous_data: existing || null,
            new_data: updated,
          });
        } else if (action.type === "delete" && action.record_id) {
          const { data: existing } = await (supabase.from(action.table) as any)
            .select("*")
            .eq("id", action.record_id)
            .maybeSingle();

          const { error } = await (supabase.from(action.table) as any)
            .delete()
            .eq("id", action.record_id);

          if (error) throw error;

          await supabase.from("ai_change_history").insert({
            plan_id: savedPlan.id,
            action_type: "delete",
            table_name: action.table,
            record_id: action.record_id,
            previous_data: existing || null,
            new_data: { deleted: true },
          });
        }
      } catch (err) {
        console.error(`Action failed:`, action, err);
        allSuccess = false;
      }
    }

    // Invalidate all content queries
    queryClient.invalidateQueries();

    return { success: allSuccess, planId: savedPlan.id };
  };

  const savePlanForLater = async (plan: ContentPlan): Promise<string | null> => {
    const { data, error } = await insertPlan({
      title: plan.title,
      description: plan.summary,
      actions: plan.actions as unknown as Record<string, unknown>,
      status: "saved",
      conversation_id: plan.conversation_id || null,
    });

    if (error) {
      toast({ title: "Failed to save plan", variant: "destructive" });
      return null;
    }
    toast({ title: "Plan saved for later" });
    return data.id;
  };

  const revertPlan = async (planId: string) => {
    const { data: changes } = await supabase
      .from("ai_change_history")
      .select("*")
      .eq("plan_id", planId)
      .eq("reverted", false)
      .order("created_at", { ascending: false });

    if (!changes || changes.length === 0) {
      toast({ title: "Nothing to revert" });
      return;
    }

    for (const change of changes) {
      if (!isAllowedTable(change.table_name)) continue;

      try {
        if (change.action_type === "create") {
          await (supabase.from(change.table_name) as any)
            .delete()
            .eq("id", change.record_id);
        } else if (change.action_type === "update" && change.previous_data) {
          const prev = change.previous_data as Record<string, unknown>;
          const { id: _id, ...rest } = prev;
          await (supabase.from(change.table_name) as any)
            .update(rest)
            .eq("id", change.record_id);
        } else if (change.action_type === "delete" && change.previous_data) {
          await (supabase.from(change.table_name) as any)
            .insert(change.previous_data);
        }

        await supabase
          .from("ai_change_history")
          .update({ reverted: true })
          .eq("id", change.id);
      } catch (err) {
        console.error("Revert failed for change:", change.id, err);
      }
    }

    await supabase
      .from("ai_content_plans")
      .update({ status: "reverted" })
      .eq("id", planId);

    queryClient.invalidateQueries();
    toast({ title: "Changes reverted successfully" });
  };

  const revertSingleChange = async (changeId: string) => {
    const { data: change } = await supabase
      .from("ai_change_history")
      .select("*")
      .eq("id", changeId)
      .maybeSingle();

    if (!change || !isAllowedTable(change.table_name)) return;

    try {
      if (change.action_type === "create") {
        await (supabase.from(change.table_name) as any)
          .delete()
          .eq("id", change.record_id);
      } else if (change.action_type === "update" && change.previous_data) {
        const prev = change.previous_data as Record<string, unknown>;
        const { id: _id, ...rest } = prev;
        await (supabase.from(change.table_name) as any)
          .update(rest)
          .eq("id", change.record_id);
      } else if (change.action_type === "delete" && change.previous_data) {
        await (supabase.from(change.table_name) as any)
          .insert(change.previous_data);
      }

      await supabase
        .from("ai_change_history")
        .update({ reverted: true })
        .eq("id", changeId);

      queryClient.invalidateQueries();
      toast({ title: "Change reverted" });
    } catch (err) {
      console.error("Revert failed:", err);
      toast({ title: "Revert failed", variant: "destructive" });
    }
  };

  const fetchSiteContext = async () => {
    // Per-table lightweight select strings — only columns that actually exist
    const tableSelects: Record<string, string> = {
      articles:         "id, title, slug, published, review_status, updated_at, category",
      updates:          "id, title, slug, published, updated_at",
      projects:         "id, title, slug, published, review_status, status, updated_at, description",
      artwork:          "id, title, category, created_at",
      experiments:      "id, name, slug, status, review_status, updated_at, platform, description",
      favorites:        "id, title, type, created_at",
      inspirations:     "id, title, category, created_at",
      experiences:      "id, title, slug, published, category, updated_at, description",
      certifications:   "id, name, issuer, status, updated_at",
      client_projects:  "id, project_name, client_name, slug, status, updated_at, description",
      skills:           "id, name, category, created_at",
      products:         "id, name, slug, status, updated_at, price, description",
      product_reviews:  "id, product_name, company, slug, published, review_status, updated_at",
      life_periods:     "id, title, start_date, end_date, is_current, created_at",
      learning_goals:   "id, title, progress_percent, created_at, description",
      funding_campaigns:"id, title, campaign_type, status, target_amount, raised_amount, updated_at",
      supplies_needed:  "id, name, price, priority, status, category, created_at",
    };

    const publishableTables = ["articles", "updates", "projects", "experiments", "product_reviews", "experiences"];
    const tablesWithUpdatedAt = ["articles", "updates", "projects", "experiments", "experiences", "product_reviews", "client_projects", "certifications", "products", "funding_campaigns"];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const context: Record<string, any> = {};

    await Promise.all(
      Object.entries(tableSelects).map(async ([table, selectStr]) => {
        try {
          const { data, count } = await (supabase.from(table as any) as any)
            .select(selectStr, { count: "exact", head: false })
            .order("created_at", { ascending: false })
            .limit(5);

          const items = data || [];
          const entry: any = {
            count: count || items.length,
            recent: items.map((item: any) => {
              const summary: any = { ...item };
              // Truncate description to 150 chars
              if (summary.description && summary.description.length > 150) {
                summary.description = summary.description.substring(0, 150) + "...";
              }
              return summary;
            }),
          };

          if (publishableTables.includes(table)) {
            const pub = items.filter((i: any) => i.published === true).length;
            entry.published = pub;
            entry.draft = items.length - pub;
          }

          if (tablesWithUpdatedAt.includes(table)) {
            const stale = items.filter((i: any) => i.updated_at && i.updated_at < ninetyDaysAgo);
            if (stale.length > 0) entry.stale = stale.length;
          }

          const missingDesc = items.filter((i: any) => 'description' in i && (!i.description || i.description.trim() === ""));
          if (missingDesc.length > 0) entry.missingDescription = missingDesc.length;

          context[table] = entry;
        } catch {
          context[table] = { count: 0, recent: [] };
        }
      })
    );

    try {
      const { data: recentChanges } = await supabase
        .from("ai_change_history")
        .select("action_type, table_name, record_id, created_at, reverted")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentChanges && recentChanges.length > 0) {
        context.RECENT_AI_CHANGES = recentChanges;
      }
    } catch {
      // non-critical
    }

    return context;
  };

  return {
    executePlan,
    savePlanForLater,
    revertPlan,
    revertSingleChange,
    fetchSiteContext,
  };
}
