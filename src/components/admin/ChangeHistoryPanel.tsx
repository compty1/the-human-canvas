import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContentActions } from "@/hooks/useContentActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Undo2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export const ChangeHistoryPanel = () => {
  const { revertPlan, revertSingleChange } = useContentActions();

  const { data: plans, refetch } = useQuery({
    queryKey: ["ai-content-plans-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_content_plans")
        .select("*")
        .in("status", ["executed", "reverted"])
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: changes, refetch: refetchChanges } = useQuery({
    queryKey: ["ai-change-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_change_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const handleRevertPlan = async (planId: string) => {
    await revertPlan(planId);
    refetch();
    refetchChanges();
  };

  const handleRevertChange = async (changeId: string) => {
    await revertSingleChange(changeId);
    refetch();
    refetchChanges();
  };

  const getChangesForPlan = (planId: string) =>
    (changes || []).filter((c) => c.plan_id === planId);

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No changes made yet</p>
        <p className="text-sm mt-1">Use the AI chat to create and execute content plans</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const planChanges = getChangesForPlan(plan.id);
        const isReverted = plan.status === "reverted";
        const hasUnreverted = planChanges.some((c) => !c.reverted);

        return (
          <div
            key={plan.id}
            className={`border rounded-lg p-4 ${isReverted ? "opacity-60 border-dashed" : "border-border"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-sm">{plan.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {plan.executed_at
                    ? format(new Date(plan.executed_at), "MMM d, yyyy h:mm a")
                    : format(new Date(plan.created_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isReverted ? "outline" : "default"}>
                  {isReverted ? "Reverted" : "Executed"}
                </Badge>
                {hasUnreverted && !isReverted && (
                  <Button size="sm" variant="outline" onClick={() => handleRevertPlan(plan.id)}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Revert All
                  </Button>
                )}
              </div>
            </div>

            {plan.description && (
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            )}

            {planChanges.length > 0 && (
              <div className="space-y-1">
                {planChanges.map((change) => (
                  <div
                    key={change.id}
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      change.reverted ? "bg-muted/30 line-through opacity-50" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          change.action_type === "create"
                            ? "default"
                            : change.action_type === "delete"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {change.action_type}
                      </Badge>
                      <span className="font-mono">{change.table_name}</span>
                      <span className="text-muted-foreground">
                        {change.record_id.slice(0, 8)}...
                      </span>
                    </div>
                    {!change.reverted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleRevertChange(change.id)}
                      >
                        <Undo2 className="w-3 h-3 mr-1" /> Undo
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
