import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  Search, Check, X, Clock, Eye, Calendar, 
  FileText, Newspaper, FolderKanban, Beaker, Star 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type ContentType = "articles" | "updates" | "projects" | "experiments" | "product_reviews";
type ReviewStatus = "draft" | "pending_review" | "approved" | "scheduled" | "published" | "rejected";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  review_status: ReviewStatus | null;
  scheduled_at: string | null;
  created_at: string;
  published?: boolean;
}

const contentTypeIcons: Record<ContentType, typeof FileText> = {
  articles: Newspaper,
  updates: FileText,
  projects: FolderKanban,
  experiments: Beaker,
  product_reviews: Star,
};

const statusColors: Record<ReviewStatus, string> = {
  draft: "bg-muted",
  pending_review: "bg-pop-yellow",
  approved: "bg-pop-green",
  scheduled: "bg-pop-cyan",
  published: "bg-green-500",
  rejected: "bg-destructive",
};

const ContentReviewManager = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const queryClient = useQueryClient();

  // Fetch all content items
  const { data: contentItems, isLoading } = useQuery({
    queryKey: ["content-review"],
    queryFn: async () => {
      const items: ContentItem[] = [];

      // Fetch articles
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, review_status, scheduled_at, created_at, published")
        .order("created_at", { ascending: false });
      articles?.forEach((a) => items.push({ ...a, type: "articles" }));

      // Fetch updates
      const { data: updates } = await supabase
        .from("updates")
        .select("id, title, review_status, scheduled_at, created_at, published")
        .order("created_at", { ascending: false });
      updates?.forEach((u) => items.push({ ...u, type: "updates" }));

      // Fetch projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, review_status, scheduled_at, created_at")
        .order("created_at", { ascending: false });
      projects?.forEach((p) => items.push({ ...p, type: "projects" }));

      // Fetch experiments
      const { data: experiments } = await supabase
        .from("experiments")
        .select("id, name, review_status, scheduled_at, created_at")
        .order("created_at", { ascending: false });
      experiments?.forEach((e) => items.push({ id: e.id, title: e.name, review_status: e.review_status, scheduled_at: e.scheduled_at, created_at: e.created_at, type: "experiments" }));

      // Fetch product reviews
      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("id, product_name, review_status, scheduled_at, created_at, published")
        .order("created_at", { ascending: false });
      reviews?.forEach((r) => items.push({ id: r.id, title: r.product_name, review_status: r.review_status, scheduled_at: r.scheduled_at, created_at: r.created_at, published: r.published, type: "product_reviews" }));

      return items;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status, scheduledAt }: { 
      id: string; 
      type: ContentType; 
      status: ReviewStatus;
      scheduledAt?: string;
    }) => {
      const updateData: Record<string, unknown> = { review_status: status };
      if (scheduledAt) updateData.scheduled_at = scheduledAt;
      if (status === "published") updateData.published = true;

      const { error } = await supabase
        .from(type)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-review"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const filteredItems = contentItems?.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.review_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEditUrl = (item: ContentItem) => {
    switch (item.type) {
      case "articles": return `/admin/articles/${item.id}/edit`;
      case "updates": return `/admin/updates/${item.id}/edit`;
      case "projects": return `/admin/projects/${item.id}/edit`;
      case "experiments": return `/admin/experiments/${item.id}/edit`;
      case "product_reviews": return `/admin/product-reviews/${item.id}/edit`;
    }
  };

  const pendingCount = contentItems?.filter((i) => i.review_status === "pending_review").length || 0;
  const scheduledCount = contentItems?.filter((i) => i.review_status === "scheduled").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Content Review</h1>
          <p className="text-muted-foreground">
            Review, approve, and schedule content for publishing
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ComicPanel className="p-4 bg-pop-yellow/20">
            <div className="text-3xl font-display">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </ComicPanel>
          <ComicPanel className="p-4 bg-pop-cyan/20">
            <div className="text-3xl font-display">{scheduledCount}</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </ComicPanel>
          <ComicPanel className="p-4">
            <div className="text-3xl font-display">
              {contentItems?.filter((i) => i.review_status === "draft").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </ComicPanel>
          <ComicPanel className="p-4 bg-green-500/20">
            <div className="text-3xl font-display">
              {contentItems?.filter((i) => i.published || i.review_status === "published").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Published</div>
          </ComicPanel>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ContentType | "all")}
            className="px-3 py-2 border-2 border-foreground bg-background"
          >
            <option value="all">All Types</option>
            <option value="articles">Articles</option>
            <option value="updates">Updates</option>
            <option value="projects">Projects</option>
            <option value="experiments">Experiments</option>
            <option value="product_reviews">Product Reviews</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | "all")}
            className="px-3 py-2 border-2 border-foreground bg-background"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const Icon = contentTypeIcons[item.type];
              const status = item.review_status || "draft";
              return (
                <ComicPanel key={`${item.type}-${item.id}`} className="p-4">
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold truncate">{item.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="capitalize">{item.type.replace("_", " ")}</span>
                        <span>•</span>
                        <span>{format(new Date(item.created_at), "MMM d, yyyy")}</span>
                        {item.scheduled_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Scheduled: {format(new Date(item.scheduled_at), "MMM d, h:mm a")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-1 text-xs font-bold uppercase ${statusColors[status]} text-foreground`}>
                      {status.replace("_", " ")}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link to={getEditUrl(item)}>
                        <button className="p-2 hover:bg-muted" title="Edit">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      
                      {status === "pending_review" && (
                        <>
                          <button
                            onClick={() => updateStatusMutation.mutate({ 
                              id: item.id, 
                              type: item.type, 
                              status: "approved" 
                            })}
                            className="p-2 hover:bg-green-100 text-green-600"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ 
                              id: item.id, 
                              type: item.type, 
                              status: "rejected" 
                            })}
                            className="p-2 hover:bg-red-100 text-red-600"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {status === "approved" && (
                        <>
                          <button
                            onClick={() => updateStatusMutation.mutate({ 
                              id: item.id, 
                              type: item.type, 
                              status: "published" 
                            })}
                            className="p-2 hover:bg-green-100 text-green-600"
                            title="Publish Now"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const date = prompt("Enter schedule date (YYYY-MM-DD HH:MM):");
                              if (date) {
                                updateStatusMutation.mutate({ 
                                  id: item.id, 
                                  type: item.type, 
                                  status: "scheduled",
                                  scheduledAt: new Date(date).toISOString()
                                });
                              }
                            }}
                            className="p-2 hover:bg-cyan-100 text-cyan-600"
                            title="Schedule"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground">No content matches your filters</p>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContentReviewManager;
