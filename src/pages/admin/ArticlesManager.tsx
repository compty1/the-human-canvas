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
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  excerpt: string | null;
  created_at: string;
  updated_at: string;
}

const ArticlesManager = () => {
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, category, published, excerpt, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Article deleted");
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("articles")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Article updated");
    },
    onError: () => {
      toast.error("Failed to update article");
    },
  });

  const categoryColors: Record<string, string> = {
    philosophy: "bg-purple-100 text-purple-700",
    narrative: "bg-blue-100 text-blue-700",
    cultural: "bg-green-100 text-green-700",
    ux_review: "bg-orange-100 text-orange-700",
    research: "bg-red-100 text-red-700",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Articles</h1>
            <p className="text-muted-foreground">
              Manage blog articles and essays
            </p>
          </div>
          <Link to="/admin/articles/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </PopButton>
          </Link>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Articles Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start writing your first article
            </p>
            <Link to="/admin/articles/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <ComicPanel key={article.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div
                    className={`w-3 h-3 rounded-full ${
                      article.published ? "bg-green-500" : "bg-orange-400"
                    }`}
                    title={article.published ? "Published" : "Draft"}
                  />

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase ${
                          categoryColors[article.category] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {article.category.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(article.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-display text-lg truncate">{article.title}</h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        togglePublishMutation.mutate({
                          id: article.id,
                          published: !article.published,
                        })
                      }
                      className="p-2 hover:bg-muted rounded"
                      title={article.published ? "Unpublish" : "Publish"}
                    >
                      {article.published ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="p-2 hover:bg-muted rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Delete this article?")) {
                          deleteMutation.mutate(article.id);
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

export default ArticlesManager;
