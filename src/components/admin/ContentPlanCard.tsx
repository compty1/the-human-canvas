import { useState } from "react";
import { ContentPlan, ContentAction, useContentActions } from "@/hooks/useContentActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ContentPlanCardProps {
  plan: ContentPlan;
  conversationId?: string;
  onExecuted?: (planId: string) => void;
  onSaved?: (planId: string) => void;
}

export const ContentPlanCard = ({ plan, conversationId, onExecuted, onSaved }: ContentPlanCardProps) => {
  const { executePlan, savePlanForLater } = useContentActions();
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editedActions, setEditedActions] = useState<ContentAction[]>(plan.actions);
  const [done, setDone] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    setProgress(0);
    const total = editedActions.length;

    // Simulate per-action progress
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

  if (done) {
    return (
      <div className="border-2 border-green-500/30 bg-green-500/5 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span className="font-bold">{plan.title}</span>
          <span className="text-sm">— Executed successfully</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-border rounded-lg overflow-hidden">
      <div className="p-4 bg-muted/30 border-b border-border">
        <h4 className="font-bold text-base">{plan.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{plan.summary}</p>
      </div>

      <div className="p-4 space-y-3">
        {editedActions.map((action, idx) => (
          <div key={idx} className={`border rounded-md p-3 ${actionColor(action.type)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={actionBadge(action.type) as any}>{action.type.toUpperCase()}</Badge>
              <span className="text-xs font-mono">{action.table}</span>
              {action.record_id && (
                <span className="text-xs font-mono text-muted-foreground">
                  {action.record_id.slice(0, 8)}...
                </span>
              )}
            </div>
            <p className="text-sm mb-2">{action.description}</p>

            {action.data && (
              <div className="space-y-1">
                {Object.entries(action.data).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-bold min-w-[100px]">{key}:</span>
                    {editing ? (
                      typeof val === "string" && val.length > 60 ? (
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
                      )
                    ) : (
                      <span className="break-all">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    )}
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
        <Button onClick={handleExecute} disabled={executing} size="sm">
          {executing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-1" />
          )}
          {editing ? "Execute Edited Plan" : "Execute Plan"}
        </Button>
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
