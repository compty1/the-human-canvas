import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Update {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  excerpt: string | null;
  tags: string[] | null;
  created_at: string;
}

const UpdatesManager = () => {
  const queryClient = useQueryClient();

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["admin-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("id, title, slug, published, excerpt, tags, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Update[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast.success("Update deleted");
    },
    onError: () => {
      toast.error("Failed to delete update");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("updates")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast.success("Update status changed");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Updates</h1>
            <p className="text-muted-foreground">
              Manage project updates and announcements
            </p>
          </div>
          <Link to="/admin/updates/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" />
              New Update
            </PopButton>
          </Link>
        </div>

        {/* Updates List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Updates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Share your first project update
            </p>
            <Link to="/admin/updates/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" />
                Create Update
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <ComicPanel key={update.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div
                    className={`w-3 h-3 rounded-full ${
                      update.published ? "bg-green-500" : "bg-orange-400"
                    }`}
                    title={update.published ? "Published" : "Draft"}
                  />

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.created_at), "MMM d, yyyy")}
                      </span>
                      {update.tags && update.tags.length > 0 && (
                        <div className="flex gap-1">
                          {update.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-lg truncate">{update.title}</h3>
                    {update.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {update.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        togglePublishMutation.mutate({
                          id: update.id,
                          published: !update.published,
                        })
                      }
                      className="p-2 hover:bg-muted rounded"
                      title={update.published ? "Unpublish" : "Publish"}
                    >
                      {update.published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      to={`/admin/updates/${update.id}/edit`}
                      className="p-2 hover:bg-muted rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Delete this update?")) {
                          deleteMutation.mutate(update.id);
                        }
                      }}
                      className="p-2 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UpdatesManager;
