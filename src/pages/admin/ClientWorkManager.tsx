import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, Briefcase, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_TYPES, getProjectTypeLabel, getProjectTypeIcon } from "@/lib/clientProjectTypes";
interface ClientProject {
  id: string;
  client_name: string;
  project_name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: string;
  is_public: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  project_type: string;
}

const ClientWorkManager = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin-client-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientProject[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-projects"] });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  const toggleVisibility = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("client_projects")
      .update({ is_public: !currentValue })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to update visibility");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-client-projects"] });
      toast.success(currentValue ? "Project hidden" : "Project published");
    }
  };

  const filteredProjects = projects.filter(p => typeFilter === "all" || p.project_type === typeFilter);
  const completedCount = filteredProjects.filter(p => p.status === "completed").length;
  const inProgressCount = filteredProjects.filter(p => p.status === "in_progress").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display flex items-center gap-3">
              <Briefcase className="w-10 h-10" />
              Client Work
            </h1>
            <p className="text-muted-foreground">Manage projects done for clients</p>
          </div>
          <Link to="/admin/client-work/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </PopButton>
          </Link>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 text-xs font-bold border border-foreground ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            All Types
          </button>
          {PROJECT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1 text-xs font-bold border border-foreground ${typeFilter === t.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{filteredProjects.length}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{completedCount}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{inProgressCount}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </ComicPanel>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No Client Projects Yet</h2>
            <p className="text-muted-foreground mb-6">Start adding projects you've done for clients</p>
            <Link to="/admin/client-work/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add First Project
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ComicPanel key={project.id} className="p-0 overflow-hidden">
                {project.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={project.image_url}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase ${
                      project.status === "completed" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                    }`}>
                      {project.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-muted">
                      {getProjectTypeIcon(project.project_type || "web_design")} {getProjectTypeLabel(project.project_type || "web_design")}
                    </span>
                    {!project.is_public && (
                      <span className="px-2 py-0.5 text-xs font-bold uppercase bg-muted">
                        Hidden
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-display text-xl mb-1">{project.project_name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Client: {project.client_name}
                  </p>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Link to={`/admin/client-work/${project.id}/edit`}>
                      <button className="p-2 border-2 border-foreground hover:bg-muted">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>
                    <button 
                      onClick={() => toggleVisibility(project.id, project.is_public)}
                      className="p-2 border-2 border-foreground hover:bg-muted"
                      title={project.is_public ? "Hide from public" : "Make public"}
                    >
                      {project.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this project?")) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="p-2 border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground"
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

export default ClientWorkManager;
