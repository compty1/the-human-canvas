import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReorderableItem {
  id: string;
  label: string;
  order_index: number;
}

interface ReorderableListProps {
  items: ReorderableItem[];
  tableName: string;
  queryKey: string[];
}

export const ReorderableList = ({
  items: initialItems,
  tableName,
  queryKey,
}: ReorderableListProps) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  // Sync when props change
  if (initialItems !== items && dragIndex === null) {
    setItems(initialItems);
  }

  const saveMutation = useMutation({
    mutationFn: async (reordered: ReorderableItem[]) => {
      const updates = reordered.map((item, idx) =>
        supabase
          .from(tableName as any)
          .update({ order_index: idx })
          .eq("id", item.id)
      );
      const results = await Promise.all(updates);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Order saved");
    },
    onError: () => {
      toast.error("Failed to save order");
    },
  });

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragItem.current === null || dragItem.current === idx) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(dragItem.current, 1);
    newItems.splice(idx, 0, moved);
    setItems(newItems);
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
    saveMutation.mutate(newItems);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-1">
      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Saving order...
        </div>
      )}
      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-3 px-4 py-3 border-2 border-foreground bg-background cursor-grab active:cursor-grabbing transition-all",
            dragIndex === idx && "opacity-50",
            overIndex === idx && dragIndex !== idx && "border-primary border-dashed"
          )}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground font-mono w-6">{idx + 1}</span>
          <span className="font-bold truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
