import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PopButton } from "@/components/pop-art";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Eye, EyeOff, X, Loader2, Archive } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  tableName: string;
  queryKey: string[];
  actions?: ("publish" | "unpublish" | "delete" | "archive")[];
  statusField?: string;
}

export const BulkActionsBar = ({
  selectedIds,
  onClearSelection,
  tableName,
  queryKey,
  actions = ["publish", "unpublish", "delete"],
  statusField = "published",
}: BulkActionsBarProps) => {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: string;
      value: boolean | string;
    }) => {
      const { error } = await supabase
        .from(tableName as "articles" | "projects" | "updates" | "experiments" | "products" | "product_reviews")
        .update({ [field]: value })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClearSelection();
      toast.success(`Updated ${selectedIds.length} items`);
    },
    onError: () => {
      toast.error("Failed to update items");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(tableName as "articles" | "projects" | "updates" | "experiments" | "products" | "product_reviews")
        .delete()
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClearSelection();
      setDeleteDialogOpen(false);
      toast.success(`Deleted ${selectedIds.length} items`);
    },
    onError: () => {
      toast.error("Failed to delete items");
    },
  });

  const handlePublish = () => {
    updateMutation.mutate({ field: statusField, value: true });
  };

  const handleUnpublish = () => {
    updateMutation.mutate({ field: statusField, value: false });
  };

  const handleArchive = () => {
    updateMutation.mutate({ field: "status", value: "archived" });
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="bg-foreground text-background px-6 py-3 rounded-none border-4 border-background shadow-2xl flex items-center gap-4">
          <span className="font-bold">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
          </span>

          <div className="h-6 w-px bg-background/30" />

          <div className="flex items-center gap-2">
            {actions.includes("publish") && (
              <button
                onClick={handlePublish}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pop-green text-foreground font-bold hover:bg-pop-green/80 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Publish
              </button>
            )}

            {actions.includes("unpublish") && (
              <button
                onClick={handleUnpublish}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-pop-yellow text-foreground font-bold hover:bg-pop-yellow/80 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Unpublish
              </button>
            )}

            {actions.includes("archive") && (
              <button
                onClick={handleArchive}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground font-bold hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                Archive
              </button>
            )}

            {actions.includes("delete") && (
              <button
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground font-bold hover:bg-destructive/80 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-background/30" />

          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-background/20 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected items will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface SelectableCheckboxProps {
  id: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const SelectableCheckbox = ({
  id,
  selectedIds,
  onToggle,
}: SelectableCheckboxProps) => {
  const isSelected = selectedIds.includes(id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(id);
      }}
      className={`w-5 h-5 border-2 border-foreground flex items-center justify-center transition-colors ${
        isSelected ? "bg-primary" : "bg-background hover:bg-muted"
      }`}
    >
      {isSelected && (
        <svg
          className="w-3 h-3 text-primary-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
};

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  };
};
