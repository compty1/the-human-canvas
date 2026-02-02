import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Briefcase,
  Palette,
  Code,
  Users,
  MoreVertical,
  Eye,
  EyeOff,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryIcons: Record<string, React.ElementType> = {
  creative: Palette,
  business: Briefcase,
  technical: Code,
  service: Users,
  other: MoreVertical,
};

const categoryColors: Record<string, string> = {
  creative: "bg-purple-500",
  business: "bg-blue-500",
  technical: "bg-green-500",
  service: "bg-orange-500",
  other: "bg-gray-500",
};

const ExperiencesManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["admin-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience deleted");
    },
    onError: () => {
      toast.error("Failed to delete experience");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("experiences")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience updated");
    },
  });

  const filteredExperiences = filter === "all" 
    ? experiences 
    : experiences.filter(e => e.category === filter);

  const categories = ["all", "creative", "business", "technical", "service", "other"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Experiences</h1>
            <p className="text-muted-foreground">Manage your past experiences and expertise</p>
          </div>
          <Link to="/admin/experiences/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </PopButton>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat === "all" ? Briefcase : categoryIcons[cat];
            const count = cat === "all" 
              ? experiences.length 
              : experiences.filter(e => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 font-bold text-sm capitalize flex items-center gap-2 border-2 transition-colors ${
                  filter === cat
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Experiences List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredExperiences.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No experiences yet</h2>
            <p className="text-muted-foreground mb-4">Add your first experience to get started</p>
            <Link to="/admin/experiences/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="space-y-4">
            {filteredExperiences.map((exp) => {
              const Icon = categoryIcons[exp.category] || Briefcase;
              return (
                <ComicPanel key={exp.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    
                    <div className={`w-10 h-10 flex items-center justify-center text-white ${categoryColors[exp.category] || "bg-gray-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg truncate">{exp.title}</h3>
                        {!exp.published && (
                          <span className="px-2 py-0.5 text-xs bg-muted font-bold">Draft</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{exp.category}</span>
                        {exp.subcategory && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{exp.subcategory}</span>
                          </>
                        )}
                        {exp.is_ongoing && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-bold">Ongoing</span>
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
                          <Link to={`/admin/experiences/${exp.id}/edit`} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => togglePublishMutation.mutate({ 
                            id: exp.id, 
                            published: !exp.published 
                          })}
                          className="flex items-center gap-2"
                        >
                          {exp.published ? (
                            <>
                              <EyeOff className="w-4 h-4" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" /> Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Delete this experience?")) {
                              deleteMutation.mutate(exp.id);
                            }
                          }}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
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

export default ExperiencesManager;
