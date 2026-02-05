import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Loader2, 
  FileText,
  Newspaper,
  FolderKanban,
  MessageSquare,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle,
  MoreVertical,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type ContentType = "article" | "update" | "project";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  published?: boolean;
}

const typeIcons: Record<ContentType, React.ElementType> = {
  article: Newspaper,
  update: MessageSquare,
  project: FolderKanban,
};

const typeColors: Record<ContentType, string> = {
  article: "bg-blue-500",
  update: "bg-purple-500",
  project: "bg-green-500",
};

const ContentLibrary = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all content types
  const { data: content = [], isLoading } = useQuery({
    queryKey: ["content-library"],
    queryFn: async () => {
      const items: ContentItem[] = [];

      // Fetch articles
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, published, scheduled_at, created_at, updated_at, review_status")
        .order("created_at", { ascending: false });
      
      if (articles) {
        items.push(...articles.map(a => ({
          id: a.id,
          title: a.title,
          type: "article" as ContentType,
          status: a.review_status || (a.published ? "published" : "draft"),
          scheduled_at: a.scheduled_at,
          created_at: a.created_at,
          updated_at: a.updated_at,
          published: a.published,
        })));
      }

      // Fetch updates
      const { data: updates } = await supabase
        .from("updates")
        .select("id, title, published, scheduled_at, created_at, updated_at, review_status")
        .order("created_at", { ascending: false });
      
      if (updates) {
        items.push(...updates.map(u => ({
          id: u.id,
          title: u.title,
          type: "update" as ContentType,
          status: u.review_status || (u.published ? "published" : "draft"),
          scheduled_at: u.scheduled_at,
          created_at: u.created_at,
          updated_at: u.updated_at,
          published: u.published,
        })));
      }

      // Fetch projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title, scheduled_at, created_at, updated_at, review_status, status")
        .order("created_at", { ascending: false });
      
      if (projects) {
        items.push(...projects.map(p => ({
          id: p.id,
          title: p.title,
          type: "project" as ContentType,
          status: p.review_status || p.status || "draft",
          scheduled_at: p.scheduled_at,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })));
      }

      // Sort by updated_at
      return items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, type, publish }: { id: string; type: ContentType; publish: boolean }) => {
      const table = type === "article" ? "articles" : type === "update" ? "updates" : "projects";
      const { error } = await supabase
        .from(table)
        .update({ published: publish, review_status: publish ? "published" : "draft" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Content updated");
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ id, type, scheduledAt }: { id: string; type: ContentType; scheduledAt: string }) => {
      const table = type === "article" ? "articles" : type === "update" ? "updates" : "projects";
      const { error } = await supabase
        .from(table)
        .update({ scheduled_at: scheduledAt, review_status: "scheduled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Content scheduled");
    },
  });

  const getEditUrl = (item: ContentItem) => {
    switch (item.type) {
      case "article": return `/admin/articles/${item.id}/edit`;
      case "update": return `/admin/updates/${item.id}/edit`;
      case "project": return `/admin/projects/${item.id}/edit`;
    }
  };

  const filteredContent = content.filter(item => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "published" && item.status !== "published") return false;
      if (statusFilter === "draft" && item.status !== "draft") return false;
      if (statusFilter === "scheduled" && !item.scheduled_at) return false;
    }
    return true;
  });

  const statuses = ["all", "draft", "scheduled", "published"];
  const types: (ContentType | "all")[] = ["all", "article", "update", "project"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Content Library</h1>
            <p className="text-muted-foreground">Manage all your content in one place</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/articles/new">
              <PopButton size="sm">
                <Plus className="w-4 h-4 mr-1" /> Article
              </PopButton>
            </Link>
            <Link to="/admin/updates/new">
              <PopButton size="sm" variant="secondary">
                <Plus className="w-4 h-4 mr-1" /> Update
              </PopButton>
            </Link>
            <Link to="/admin/projects/new">
              <PopButton size="sm" variant="secondary">
                <Plus className="w-4 h-4 mr-1" /> Project
              </PopButton>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {types.map((type) => {
              const Icon = type === "all" ? FileText : typeIcons[type];
              const count = type === "all" 
                ? content.length 
                : content.filter(c => c.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 font-bold text-sm capitalize flex items-center gap-1.5 border-2 transition-colors ${
                    typeFilter === type
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type === "all" ? "All Types" : `${type}s`} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {statuses.map((status) => {
              const count = status === "all" 
                ? content.length 
                : content.filter(c => {
                    if (status === "scheduled") return c.scheduled_at;
                    return c.status === status;
                  }).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 font-bold text-sm capitalize flex items-center gap-1.5 border-2 transition-colors ${
                    statusFilter === status
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground hover:bg-muted"
                  }`}
                >
                  {status === "all" ? "All Status" : status} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredContent.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No content found</h2>
            <p className="text-muted-foreground">Create your first piece of content to get started</p>
          </ComicPanel>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <ComicPanel key={`${item.type}-${item.id}`} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center text-white ${typeColors[item.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg truncate">{item.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-bold capitalize ${
                          item.status === "published" ? "bg-green-500 text-white" :
                          item.status === "scheduled" ? "bg-blue-500 text-white" :
                          "bg-muted"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>Updated {format(new Date(item.updated_at), "MMM d, yyyy")}</span>
                        {item.scheduled_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-blue-600">
                              <Clock className="w-3 h-3" />
                              Scheduled for {format(new Date(item.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={getEditUrl(item)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link 
                            to={`/admin/${item.type === "article" ? "articles" : item.type === "update" ? "updates" : "projects"}/new?clone=${item.id}`} 
                            className="flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" /> Duplicate
                          </Link>
                        </DropdownMenuItem>
                        {item.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => publishMutation.mutate({ id: item.id, type: item.type, publish: true })}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Publish Now
                          </DropdownMenuItem>
                        )}
                        {item.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => publishMutation.mutate({ id: item.id, type: item.type, publish: false })}
                            className="flex items-center gap-2"
                          >
                            <EyeOff className="w-4 h-4" /> Unpublish
                          </DropdownMenuItem>
                        )}
                        {item.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => {
                              const date = prompt("Enter scheduled date (YYYY-MM-DD HH:MM):");
                              if (date) {
                                scheduleMutation.mutate({ id: item.id, type: item.type, scheduledAt: new Date(date).toISOString() });
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4" /> Schedule
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContentLibrary;
