import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Plus, X, BookOpen, Edit, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PopButton } from "@/components/pop-art";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KnowledgeEntryWidgetProps {
  entityType: string;
  entityId?: string;
  className?: string;
}

export const KnowledgeEntryWidget = ({
  entityType,
  entityId,
  className,
}: KnowledgeEntryWidgetProps) => {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", category: "general", tags: "" });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["knowledge-entries", entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from("knowledge_entries")
        .select("*")
        .eq("entity_type", entityType)
        .order("created_at", { ascending: false });

      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["knowledge-entries", entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ["knowledge-base-all"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        entity_type: entityType,
        entity_id: entityId || null,
        title: newEntry.title,
        content: newEntry.content || null,
        category: newEntry.category,
        tags: newEntry.tags ? newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editingEntryId) {
        const { error } = await supabase.from("knowledge_entries").update(payload).eq("id", editingEntryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("knowledge_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(editingEntryId ? "Entry updated" : "Knowledge entry added");
      setNewEntry({ title: "", content: "", category: "general", tags: "" });
      setEditingEntryId(null);
      setShowAdd(false);
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Entry deleted");
    },
  });

  const startEdit = (entry: any) => {
    setNewEntry({
      title: entry.title,
      content: entry.content || "",
      category: entry.category || "general",
      tags: entry.tags?.join(", ") || "",
    });
    setEditingEntryId(entry.id);
    setShowAdd(true);
  };

  const cancelEdit = () => {
    setNewEntry({ title: "", content: "", category: "general", tags: "" });
    setEditingEntryId(null);
    setShowAdd(false);
  };

  return (
    <div className={cn("border-2 border-foreground", className)}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-sm">
          <BookOpen className="w-4 h-4" />
          Knowledge Base
          {entries.length > 0 && (
            <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold">
              {entries.length}
            </span>
          )}
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="p-3 border-t-2 border-foreground space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No knowledge entries yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="p-2 bg-muted text-sm group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold">{entry.title}</span>
                      {entry.category && (
                        <span className="ml-2 text-[10px] px-1 py-0.5 bg-primary/20 text-primary">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="p-1 hover:text-primary"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="p-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {entry.content && (
                    <p className="text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] px-1 bg-muted-foreground/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAdd ? (
            <div className="space-y-2 p-2 border border-dashed border-foreground">
              <Input
                placeholder="Entry title..."
                value={newEntry.title}
                onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))}
              />
              <Textarea
                placeholder="Details, notes, information..."
                value={newEntry.content}
                onChange={(e) => setNewEntry((p) => ({ ...p, content: e.target.value }))}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-8 px-2 text-sm border bg-background"
                  >
                    <option value="general">General</option>
                    <option value="brand-info">Brand Info</option>
                    <option value="progress-note">Progress Note</option>
                    <option value="research">Research</option>
                    <option value="lesson">Lesson</option>
                    <option value="process">Process</option>
                    <option value="reference">Reference</option>
                    <option value="ai_generated">AI Generated</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="tag1, tag2"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <PopButton
                  onClick={() => saveMutation.mutate()}
                  disabled={!newEntry.title || saveMutation.isPending}
                  className="text-xs"
                >
                  {editingEntryId ? "Update" : "Save"}
                </PopButton>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs px-3 py-1 border border-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
};
