import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowRight, Loader2 } from "lucide-react";

interface ClientProject {
  id: string;
  client_name: string;
  project_name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  tech_stack: string[] | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

const ClientWork = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientProject[];
    },
  });

  const completedProjects = projects.filter(p => p.status === "completed");
  const inProgressProjects = projects.filter(p => p.status === "in_progress");

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

      {/* Stats */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-8 justify-center">
            <div className="text-center">
              <div className="text-4xl font-display text-primary">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-display text-green-500">{completedProjects.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-display text-yellow-500">{inProgressProjects.length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No Client Projects Yet</h2>
              <p className="text-muted-foreground">Check back soon for client work examples.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link key={project.id} to={`/client-work/${project.slug}`}>
                  <ComicPanel className="h-full p-0 overflow-hidden hover:translate-y-[-4px] transition-transform">
                    {project.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={project.image_url}
                          alt={project.project_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase ${
                          project.status === "completed" ? "bg-green-500 text-white" : "bg-yellow-400"
                        }`}>
                          {project.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                        {project.start_date && (
                          <span className="text-xs text-muted-foreground">
                            {project.status === "in_progress" 
                              ? `Started ${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                              : project.end_date 
                                ? `${new Date(project.start_date).getFullYear()} - ${new Date(project.end_date).getFullYear()}`
                                : new Date(project.start_date).getFullYear()
                            }
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-2xl font-display mb-1">{project.project_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">for {project.client_name}</p>
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description}
                        </p>
                      )}

                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {project.tech_stack.slice(0, 3).map((tech) => (
                            <span key={tech} className="px-2 py-0.5 text-xs bg-muted font-bold">
                              {tech}
                            </span>
                          ))}
                          {project.tech_stack.length > 3 && (
                            <span className="px-2 py-0.5 text-xs bg-muted font-bold">
                              +{project.tech_stack.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                        View Details <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </ComicPanel>
                </Link>
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
          <Link to="/support">
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
