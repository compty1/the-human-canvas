import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowRight, Loader2, Calendar } from "lucide-react";
import { PROJECT_TYPES, getProjectTypeLabel, getProjectTypeIcon } from "@/lib/clientProjectTypes";

const ClientWork = () => {
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filteredProjects = projects.filter(p => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesType = typeFilter === "all" || p.project_type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Get unique project types present in data
  const usedTypes = Array.from(new Set(projects.map(p => p.project_type || "web_design")));

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Portfolio</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <Briefcase className="w-12 h-12" />
            Client Work
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Projects I've built for clients - from web applications to design systems and beyond.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { id: "all", label: "All Projects" },
              { id: "completed", label: "Completed" },
              { id: "in_progress", label: "In Progress" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {usedTypes.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1 text-xs font-bold border border-foreground transition-all ${
                  typeFilter === "all" ? "bg-accent text-accent-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                All Types
              </button>
              {usedTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-bold border border-foreground transition-all ${
                    typeFilter === type ? "bg-accent text-accent-foreground" : "bg-background hover:bg-muted"
                  }`}
                >
                  {getProjectTypeIcon(type)} {getProjectTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No Client Projects Found</h2>
              <p className="text-muted-foreground">
                {statusFilter === "all" 
                  ? "Check back soon for client work examples."
                  : `No ${statusFilter === "completed" ? "completed" : "in progress"} projects at the moment.`
                }
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <ComicPanel
                  key={project.id}
                  className={`p-6 flex flex-col animate-fade-in stagger-${(index % 5) + 1}`}
                >
                  {project.image_url && (
                    <Link to={`/client-work/${project.slug}`} className="block mb-4 -mx-6 -mt-6 relative">
                      <img 
                        src={project.image_url} 
                        alt={project.project_name}
                        loading="lazy"
                        className="w-full h-48 object-cover border-b-4 border-foreground"
                      />
                    </Link>
                  )}

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div
                      className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground ${
                        project.status === "completed"
                          ? "bg-pop-cyan"
                          : "bg-pop-yellow"
                      }`}
                    >
                      {project.status === "completed" ? "Completed" : "In Progress"}
                    </div>
                    {/* Project Type Badge */}
                    <span className="px-2 py-1 text-xs font-bold bg-muted border border-foreground">
                      {getProjectTypeIcon(project.project_type || "web_design")} {getProjectTypeLabel(project.project_type || "web_design")}
                    </span>
                    {project.start_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {project.status === "in_progress" 
                          ? `Started ${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                          : project.end_date
                          ? `Completed ${new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                          : new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <Link to={`/client-work/${project.slug}`}>
                    <h3 className="text-2xl font-display mb-1 hover:text-primary transition-colors">
                      {project.project_name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-2">for {project.client_name}</p>
                  
                  {project.description && (
                    <p className="text-sm font-sans text-muted-foreground mb-4 flex-grow line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tech_stack.slice(0, 4).map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-1 text-xs font-bold bg-muted border border-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.tech_stack.length > 4 && (
                        <span className="px-2 py-1 text-xs font-bold bg-muted border border-foreground">
                          +{project.tech_stack.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-muted">
                    <Link 
                      to={`/client-work/${project.slug}`}
                      className="pop-link text-sm font-bold inline-flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </ComicPanel>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-pop-yellow mb-4">
            Want to Work Together?
          </h2>
          <p className="text-lg opacity-80 max-w-xl mx-auto mb-8">
            I'm available for freelance projects. Let's build something amazing.
          </p>
          <Link to="/contact">
            <PopButton variant="accent" size="lg">
              Get in Touch
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default ClientWork;