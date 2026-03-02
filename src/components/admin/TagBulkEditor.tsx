import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopButton } from "@/components/pop-art";
import { Tags, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface TagBulkEditorProps {
  selectedIds: string[];
  tableName: string;
  queryKey: string[];
  onDone: () => void;
  field?: "tags" | "category";
}

export const TagBulkEditor = ({
  selectedIds,
  tableName,
  queryKey,
  onDone,
  field = "tags",
}: TagBulkEditorProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (field === "category") {
        // Set category directly
        const { error } = await supabase
          .from(tableName as any)
          .update({ category: inputValue.trim() })
          .in("id", selectedIds);
        if (error) throw error;
      } else {
        // For tags, we need to fetch existing then merge
        const { data: existing, error: fetchError } = await supabase
          .from(tableName as any)
          .select("id, tags")
          .in("id", selectedIds);
        if (fetchError) throw fetchError;

        const updates = (existing || []).map((row: any) => {
          const current: string[] = row.tags || [];
          const merged = [...new Set([...current, ...tagsToAdd])];
          return supabase
            .from(tableName as any)
            .update({ tags: merged })
            .eq("id", row.id);
        });
        const results = await Promise.all(updates);
        const anyError = results.find((r) => r.error);
        if (anyError?.error) throw anyError.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(
        field === "category"
          ? `Category set on ${selectedIds.length} items`
          : `Tags added to ${selectedIds.length} items`
      );
      setOpen(false);
      setTagsToAdd([]);
      setInputValue("");
      onDone();
    },
    onError: () => {
      toast.error("Failed to update");
    },
  });

  const addTag = () => {
    const tag = inputValue.trim();
    if (tag && !tagsToAdd.includes(tag)) {
      setTagsToAdd((prev) => [...prev, tag]);
      setInputValue("");
    }
  };

  const removeTag = (tag: string) => {
    setTagsToAdd((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-pop-cyan text-foreground font-bold hover:bg-pop-cyan/80 disabled:opacity-50 transition-colors"
          disabled={selectedIds.length === 0}
        >
          <Tags className="w-4 h-4" />
          {field === "category" ? "Set Category" : "Set Tags"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="space-y-3">
          <Label>{field === "category" ? "Category" : "Add Tags"}</Label>

          {field === "tags" ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  onClick={addTag}
                  className="p-2 border-2 border-foreground hover:bg-muted"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tagsToAdd.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagsToAdd.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <PopButton
                onClick={() => mutation.mutate()}
                disabled={tagsToAdd.length === 0 || mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Tags to {selectedIds.length} Items
              </PopButton>
            </>
          ) : (
            <>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter category..."
              />
              <PopButton
                onClick={() => mutation.mutate()}
                disabled={!inputValue.trim() || mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Set Category on {selectedIds.length} Items
              </PopButton>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
