import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { DuplicateButton } from "@/components/admin/DuplicateButton";
import { BulkActionsBar, SelectableCheckbox, useSelection } from "@/components/admin/BulkActionsBar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Star, TrendingUp, ExternalLink, Copy, Search } from "lucide-react";
import { toast } from "sonner";

const ExperimentsManager = () => {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [search, setSearch] = useState("");
  const { selectedIds, toggleSelection, clearSelection } = useSelection();

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["admin-experiments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experiments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiments"] });
      toast.success("Experiment deleted");
    },
    onError: () => {
      toast.error("Failed to delete experiment");
    },
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const statusColors: Record<string, string> = {
    active: "bg-pop-green",
    paused: "bg-pop-yellow",
    closed: "bg-muted",
    sold: "bg-pop-cyan",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Experiments</h1>
            <p className="text-muted-foreground">Manage your business ventures and experiments</p>
          </div>
          <Link to="/admin/experiments/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" />
              Add Experiment
            </PopButton>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-muted" />
            ))}
          </div>
        ) : experiments && experiments.length > 0 ? (
          <div className="space-y-4">
            {experiments
              .filter(exp => !search || exp.name.toLowerCase().includes(search.toLowerCase()) || exp.platform?.toLowerCase().includes(search.toLowerCase()))
              .map((exp) => (
              <ComicPanel key={exp.id} className="p-4">
                <div className="flex items-center gap-4">
                  <SelectableCheckbox id={exp.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                  {/* Image */}
                  {exp.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 border-2 border-foreground overflow-hidden">
                      <img src={exp.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-muted-foreground">{exp.platform}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase ${statusColors[exp.status]}`}>
                        {exp.status}
                      </span>
                    </div>
                    <h3 className="font-display text-lg truncate">{exp.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {exp.average_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-pop-yellow" />
                          {exp.average_rating}/5
                        </span>
                      )}
                      {exp.revenue > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-pop-green" />
                          ${exp.revenue.toLocaleString()}
                        </span>
                      )}
                      {exp.start_date && (
                        <span>
                          {new Date(exp.start_date).getFullYear()}
                          {exp.end_date && ` - ${new Date(exp.end_date).getFullYear()}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/experiments/${exp.slug}`}
                      target="_blank"
                      className="p-2 hover:bg-muted"
                      title="View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <DuplicateButton id={exp.id} type="experiment" />
                    <Link
                      to={`/admin/experiments/${exp.id}/edit`}
                      className="p-2 hover:bg-muted"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(exp.id, exp.name)}
                      className="p-2 hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No experiments yet.</p>
            <Link to="/admin/experiments/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Experiment
              </PopButton>
            </Link>
          </ComicPanel>
        )}
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={clearSelection}
        tableName="experiments"
        queryKey={["admin-experiments"]}
        actions={["delete"]}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
        title={`Delete "${deleteName}"?`}
        description="This cannot be undone."
      />
    </AdminLayout>
  );
};

export default ExperimentsManager;
