import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { DuplicateButton } from "@/components/admin/DuplicateButton";
import { BulkActionsBar, SelectableCheckbox, useSelection } from "@/components/admin/BulkActionsBar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Search,
  Eye,
  CheckSquare
} from "lucide-react";
import { toast } from "sonner";

const ProjectsManager = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { selectedIds, toggleSelection, selectAll, clearSelection } = useSelection();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const filteredProjects = projects?.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-pop-cyan";
      case "in_progress": return "bg-pop-yellow";
      default: return "bg-muted";
    }
  };

  const handleSelectAll = () => {
    if (filteredProjects) {
      if (selectedIds.length === filteredProjects.length) {
        clearSelection();
      } else {
        selectAll(filteredProjects.map((p) => p.id));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Projects</h1>
            <p className="text-muted-foreground">Manage your portfolio projects</p>
          </div>
          <div className="flex items-center gap-2">
            {filteredProjects && filteredProjects.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 border-2 border-foreground hover:bg-muted transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedIds.length === filteredProjects.length ? "Deselect All" : "Select All"}
              </button>
            )}
            <Link to="/admin/projects/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> New Project
              </PopButton>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "live", "in_progress", "planned"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm font-bold uppercase border-2 border-foreground transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ComicPanel key={project.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Selection checkbox */}
                  <SelectableCheckbox
                    id={project.id}
                    selectedIds={selectedIds}
                    onToggle={toggleSelection}
                  />

                  {/* Thumbnail */}
                  {project.image_url && (
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-20 h-20 object-cover border-2 border-foreground flex-shrink-0"
                    />
                  )}
                  
                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-display">{project.title}</h3>
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase ${getStatusColor(project.status)}`}>
                            {project.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {project.external_url && (
                          <a 
                            href={project.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Link 
                          to={`/projects/${project.slug}`}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <DuplicateButton id={project.id} type="project" />
                        <Link 
                          to={`/admin/projects/${project.id}/edit`}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            if (confirm("Delete this project?")) {
                              deleteMutation.mutate(project.id);
                            }
                          }}
                          className="p-2 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <span>{project.tech_stack.slice(0, 3).join(", ")}{project.tech_stack.length > 3 ? "..." : ""}</span>
                      )}
                      {project.funding_goal && (
                        <span>
                          Funding: ${project.funding_raised || 0} / ${project.funding_goal}
                        </span>
                      )}
                      <span>
                        Updated: {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No projects found</p>
            <Link to="/admin/projects/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Project
              </PopButton>
            </Link>
          </ComicPanel>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          tableName="projects"
          queryKey={["admin-projects"]}
          actions={["archive", "delete"]}
          statusField="status"
        />
      </div>
    </AdminLayout>
  );
};

export default ProjectsManager;
