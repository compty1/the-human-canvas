import { useState, useEffect } from "react";
import { ContentPlan, ContentAction, useContentActions } from "@/hooks/useContentActions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Play, Save, Pencil, Check, X, Loader2, Eye, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/lib/adminRoutes";

interface ContentPlanCardProps {
  plan: ContentPlan;
  conversationId?: string;
  onExecuted?: (planId: string) => void;
  onSaved?: (planId: string) => void;
}

type CurrentDataMap = Record<number, Record<string, any> | null>;

export const ContentPlanCard = ({ plan, conversationId, onExecuted, onSaved }: ContentPlanCardProps) => {
  const navigate = useNavigate();
  const { executePlan, savePlanForLater } = useContentActions();
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editedActions, setEditedActions] = useState<ContentAction[]>(plan.actions);
  const [done, setDone] = useState(false);
  const [executedRecords, setExecutedRecords] = useState<{ table: string; id: string; type: string }[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [currentData, setCurrentData] = useState<CurrentDataMap>({});

  // Auto-expand review on first render
  useEffect(() => {
    if (!reviewing && !done && editedActions.length > 0) {
      toggleReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionCounts = editedActions.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const fetchCurrentData = async () => {
    setLoadingReview(true);
    const dataMap: CurrentDataMap = {};
    for (let i = 0; i < editedActions.length; i++) {
      const action = editedActions[i];
      if ((action.type === "update" || action.type === "delete") && action.record_id) {
        const { data } = await supabase
          .from(action.table as any)
          .select("*")
          .eq("id", action.record_id)
          .maybeSingle();
        dataMap[i] = data;
      } else {
        dataMap[i] = null;
      }
    }
    setCurrentData(dataMap);
    setLoadingReview(false);
  };

  const toggleReview = async () => {
    if (!reviewing) {
      await fetchCurrentData();
    }
    setReviewing(!reviewing);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setProgress(0);
    const total = editedActions.length;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / total, 95));
    }, 300);

    const result = await executePlan({
      ...plan,
      actions: editedActions,
      conversation_id: conversationId,
    });

    clearInterval(interval);
    setProgress(100);
    setExecuting(false);

    if (result.success) {
      toast({ title: "Plan executed successfully!" });
      setDone(true);
      // Collect executed record info for deep links
      const records = editedActions
        .filter((a) => a.type !== "delete")
        .map((a) => ({ table: a.table, id: a.record_id || "", type: a.type }));
      setExecutedRecords(records);
      onExecuted?.(result.planId!);
    } else {
      toast({ title: "Some actions failed", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    const planId = await savePlanForLater({
      ...plan,
      actions: editedActions,
      conversation_id: conversationId,
    });
    if (planId) onSaved?.(planId);
  };

  const updateActionData = (idx: number, field: string, value: string) => {
    setEditedActions((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, data: { ...a.data, [field]: value } } : a
      )
    );
  };

  const actionColor = (type: string) => {
    if (type === "create") return "bg-green-500/10 border-green-500/30 text-green-700";
    if (type === "update") return "bg-yellow-500/10 border-yellow-500/30 text-yellow-700";
    if (type === "delete") return "bg-red-500/10 border-red-500/30 text-red-700";
    return "bg-muted";
  };

  const actionBadge = (type: string) => {
    if (type === "create") return "default";
    if (type === "update") return "secondary";
    return "destructive";
  };

  const openInEditor = (table: string, id: string) => {
    const route = ADMIN_ROUTES[table];
    if (route) navigate(route.editor(id));
  };

  if (done) {
    return (
      <div className="border-2 border-green-500/30 bg-green-500/5 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span className="font-bold">{plan.title}</span>
          <span className="text-sm">— Executed successfully</span>
        </div>
        {executedRecords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {executedRecords.map((r, i) => {
              const route = ADMIN_ROUTES[r.table];
              if (!route || !r.id) return null;
              return (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => openInEditor(r.table, r.id)}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open {r.table.replace(/_/g, " ")} in editor
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-2 border-border rounded-lg overflow-hidden">
      <div className="p-4 bg-muted/30 border-b border-border">
        <h4 className="font-bold text-base">{plan.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {actionCounts.create && (
            <Badge variant="default" className="text-xs">{actionCounts.create} create{actionCounts.create > 1 ? "s" : ""}</Badge>
          )}
          {actionCounts.update && (
            <Badge variant="secondary" className="text-xs">{actionCounts.update} update{actionCounts.update > 1 ? "s" : ""}</Badge>
          )}
          {actionCounts.delete && (
            <Badge variant="destructive" className="text-xs">{actionCounts.delete} delete{actionCounts.delete > 1 ? "s" : ""}</Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {editedActions.map((action, idx) => (
          <div key={idx} className={`border rounded-md p-3 ${actionColor(action.type)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={actionBadge(action.type) as any}>{action.type.toUpperCase()}</Badge>
              <span className="text-xs font-mono">{action.table}</span>
              {action.record_id && (
                <>
                  <span className="text-xs font-mono text-muted-foreground">
                    {action.record_id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => openInEditor(action.table, action.record_id!)}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-auto"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </button>
                </>
              )}
            </div>
            <p className="text-sm mb-2">{action.description}</p>

            {/* Review diff for update/delete */}
            {reviewing && currentData[idx] && action.data && (
              <div className="mb-2 space-y-1 bg-background/50 rounded p-2 text-xs">
                <p className="font-bold text-muted-foreground mb-1">Changes:</p>
                {Object.entries(action.data).map(([key, newVal]) => {
                  const oldVal = currentData[idx]?.[key];
                  const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                  return (
                    <div key={key} className="flex items-start gap-1">
                      <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                      {changed ? (
                        <span>
                          <span className="line-through text-destructive/70">{oldVal != null ? String(typeof oldVal === "object" ? JSON.stringify(oldVal) : oldVal) : "(empty)"}</span>
                          <span className="mx-1">→</span>
                          <span className="text-green-700 font-medium">{String(typeof newVal === "object" ? JSON.stringify(newVal) : newVal)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{String(typeof newVal === "object" ? JSON.stringify(newVal) : newVal)} (unchanged)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review for create */}
            {reviewing && action.type === "create" && action.data && (
              <div className="mb-2 space-y-1 bg-background/50 rounded p-2 text-xs">
                <p className="font-bold text-green-700 mb-1">New record:</p>
                {Object.entries(action.data).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-1">
                    <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                    <span className="text-green-700">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Review for delete */}
            {reviewing && action.type === "delete" && currentData[idx] && (
              <div className="mb-2 space-y-1 bg-destructive/5 rounded p-2 text-xs">
                <p className="font-bold text-destructive mb-1">Will be deleted:</p>
                {Object.entries(currentData[idx]!).slice(0, 8).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-1">
                    <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                    <span className="line-through text-destructive/70">{typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Edit mode */}
            {editing && action.data && (
              <div className="space-y-1">
                {Object.entries(action.data).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                    {typeof val === "string" && val.length > 60 ? (
                      <Textarea
                        value={String(editedActions[idx]?.data?.[key] ?? val)}
                        onChange={(e) => updateActionData(idx, key, e.target.value)}
                        className="text-xs min-h-[60px]"
                      />
                    ) : (
                      <Input
                        value={String(editedActions[idx]?.data?.[key] ?? val)}
                        onChange={(e) => updateActionData(idx, key, e.target.value)}
                        className="text-xs h-7"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Default display */}
            {!editing && !reviewing && action.data && (
              <div className="space-y-1">
                {Object.entries(action.data).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                    <span className="break-all">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {executing && (
        <div className="px-4 pb-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Executing plan...</p>
        </div>
      )}

      <div className="p-4 border-t border-border flex gap-2 flex-wrap">
        <Button
          onClick={toggleReview}
          variant={reviewing ? "secondary" : "outline"}
          size="sm"
          disabled={executing || loadingReview}
        >
          {loadingReview ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : reviewing ? (
            <ChevronUp className="w-4 h-4 mr-1" />
          ) : (
            <Eye className="w-4 h-4 mr-1" />
          )}
          {reviewing ? "Hide Review" : "Review Changes"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={executing}>
              {executing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {editing ? "Execute Edited Plan" : "Execute Plan"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Execute Plan: {plan.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {editedActions.length} action{editedActions.length !== 1 ? "s" : ""} will be performed:
                {actionCounts.create ? ` ${actionCounts.create} create${actionCounts.create > 1 ? "s" : ""},` : ""}
                {actionCounts.update ? ` ${actionCounts.update} update${actionCounts.update > 1 ? "s" : ""},` : ""}
                {actionCounts.delete ? ` ${actionCounts.delete} delete${actionCounts.delete > 1 ? "s" : ""}` : ""}
                . This can be reverted from the change history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExecute}>Execute</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleSave} variant="outline" size="sm" disabled={executing}>
          <Save className="w-4 h-4 mr-1" /> Save for Later
        </Button>
        <Button
          onClick={() => {
            setEditing(!editing);
            if (!editing) setEditedActions([...plan.actions]);
          }}
          variant="ghost"
          size="sm"
          disabled={executing}
        >
          {editing ? <X className="w-4 h-4 mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
          {editing ? "Cancel Edit" : "Edit Plan"}
        </Button>
      </div>
    </div>
  );
};
