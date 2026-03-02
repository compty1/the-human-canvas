import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PopButton } from "@/components/pop-art";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export interface QuickEditField {
  key: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "tags";
}

interface QuickEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  recordId: string | null;
  fields: QuickEditField[];
  queryKey: string[];
}

export const QuickEditDrawer = ({
  open,
  onOpenChange,
  tableName,
  recordId,
  fields,
  queryKey,
}: QuickEditDrawerProps) => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Fetch record when opened
  useEffect(() => {
    if (!open || !recordId) return;
    setLoading(true);
    const fieldKeys = fields.map((f) => f.key).join(", ");
    supabase
      .from(tableName as any)
      .select(`id, ${fieldKeys}`)
      .eq("id", recordId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load record");
        } else if (data) {
          setValues(data as Record<string, any>);
        }
        setLoading(false);
      });
  }, [open, recordId, tableName, fields]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {};
      fields.forEach((f) => {
        updates[f.key] = values[f.key];
      });
      const { error } = await supabase
        .from(tableName as any)
        .update(updates)
        .eq("id", recordId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Saved!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save");
    },
  });

  const updateValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick Edit</SheetTitle>
          <SheetDescription>Edit fields inline without leaving the list.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`qe-${field.key}`}>{field.label}</Label>
                {field.type === "text" && (
                  <Input
                    id={`qe-${field.key}`}
                    value={values[field.key] || ""}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    id={`qe-${field.key}`}
                    value={values[field.key] || ""}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    rows={4}
                  />
                )}
                {field.type === "boolean" && (
                  <Switch
                    id={`qe-${field.key}`}
                    checked={!!values[field.key]}
                    onCheckedChange={(v) => updateValue(field.key, v)}
                  />
                )}
                {field.type === "tags" && (
                  <Input
                    id={`qe-${field.key}`}
                    value={(values[field.key] || []).join(", ")}
                    onChange={(e) =>
                      updateValue(
                        field.key,
                        e.target.value
                          .split(",")
                          .map((t: string) => t.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                )}
              </div>
            ))}

            <PopButton
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full mt-4"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </PopButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
