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
  "life_periods", "learning_goals", "funding_campaigns",
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
            .single();

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
            .single();

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
      .single();

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
    const tables = [
      "articles", "updates", "projects", "artwork", "experiments",
      "favorites", "inspirations", "experiences", "certifications",
      "client_projects", "skills", "products",
    ];

    const context: Record<string, { count: number; recent: any[] }> = {};

    await Promise.all(
      tables.map(async (table) => {
        try {
          const { data, count } = await (supabase.from(table as any) as any)
            .select("*", { count: "exact", head: false })
            .order("created_at", { ascending: false })
            .limit(5);

          context[table] = {
            count: count || (data?.length ?? 0),
            recent: (data || []).map((item: any) => {
              const summary: any = { id: item.id };
              if (item.title) summary.title = item.title;
              if (item.name) summary.name = item.name;
              if (item.slug) summary.slug = item.slug;
              if (item.status) summary.status = item.status;
              if (item.published !== undefined) summary.published = item.published;
              if (item.category) summary.category = item.category;
              if (item.description) summary.description = item.description?.substring(0, 100);
              return summary;
            }),
          };
        } catch {
          context[table] = { count: 0, recent: [] };
        }
      })
    );

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
