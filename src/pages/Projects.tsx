import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, LikeButton } from "@/components/pop-art";
import { TexturedSection } from "@/components/layout/TexturedSection";
import { DecorativeArt } from "@/components/home/DecorativeArt";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, ArrowRight, Heart, Loader2, Calendar } from "lucide-react";

type ProjectFilter = "all" | "live" | "in_progress" | "planned" | "finishing_stages" | "final_review";

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: "Planned", color: "bg-muted" },
  in_progress: { label: "In Progress", color: "bg-pop-gold" },
  finishing_stages: { label: "Finishing", color: "bg-pop-terracotta" },
  final_review: { label: "Final Review", color: "bg-pop-burgundy text-pop-cream" },
  live: { label: "Live", color: "bg-pop-teal text-pop-cream" },
};

const Projects = () => {
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = projects?.filter(p => 
    filter === "all" ? true : p.status === filter
  );

  return (
    <Layout>
      {/* Hero */}
      <TexturedSection variant="warm" texture="dots" className="py-20 relative overflow-hidden">
        {/* Decorative Art */}
        <DecorativeArt variant="left" className="absolute -left-10 top-10" />
        <DecorativeArt variant="accent" className="absolute right-20 bottom-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-block px-4 py-2 bg-pop-teal text-pop-cream font-bold uppercase tracking-wide border-2 border-foreground mb-4">
            Tech Projects
          </div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Projects Hub
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Building tools for change and innovation. From virtual notebooks to
            community platforms — technology that makes a difference.
          </p>
        </div>
      </TexturedSection>

      {/* Filter */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Projects" },
              { id: "live", label: "Live" },
              { id: "final_review", label: "Final Review" },
              { id: "finishing_stages", label: "Finishing" },
              { id: "in_progress", label: "In Progress" },
              { id: "planned", label: "Planned" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as ProjectFilter)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <ComicPanel
                  key={project.id}
                  className={`p-6 flex flex-col animate-fade-in stagger-${(index % 5) + 1}`}
                >
                  {/* Logo + Image */}
                  {project.image_url && (
                    <Link to={`/projects/${project.slug}`} className="block mb-4 -mx-6 -mt-6 relative">
                      <img 
                        src={project.image_url} 
                        alt={project.title}
                        className="w-full h-48 object-cover border-b-4 border-foreground"
                      />
                      {project.logo_url && (
                        <div className="absolute bottom-2 left-2 w-12 h-12 bg-background border-2 border-foreground p-1 flex items-center justify-center">
                          <img 
                            src={project.logo_url} 
                            alt={`${project.title} logo`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </Link>
                  )}

                  {/* Status Badge + Date */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div
                      className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground ${
                        statusConfig[project.status]?.color || "bg-muted"
                      }`}
                    >
                      {statusConfig[project.status]?.label || project.status}
                    </div>
                    {/* Date Display */}
                    {project.start_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {project.status === "in_progress" 
                          ? `Started ${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                          : project.status === "live" && project.end_date
                          ? `Launched ${new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                          : new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <Link to={`/projects/${project.slug}`}>
                    <h3 className="text-2xl font-display mb-3 hover:text-primary transition-colors">{project.title}</h3>
                  </Link>
                  <p className="text-sm font-sans text-muted-foreground mb-4 flex-grow">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tech_stack.slice(0, 4).map((tech) => (
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

                  {/* Funding Progress (for in-progress projects) */}
                  {project.status === "in_progress" && project.funding_goal && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>Funding Progress</span>
                        <span>
                          ${(project.funding_raised || 0).toLocaleString()} / $
                          {project.funding_goal.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 bg-muted border-2 border-foreground overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${
                              ((project.funding_raised || 0) / project.funding_goal) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-muted">
                    <Link 
                      to={`/projects/${project.slug}`}
                      className="pop-link text-sm font-bold inline-flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>

                    {project.status === "live" && project.external_url ? (
                      <a
                        href={project.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pop-link text-sm font-bold inline-flex items-center gap-1"
                      >
                        Visit Site <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : project.status !== "live" ? (
                      <Link
                        to="/support"
                        className="pop-link text-sm font-bold inline-flex items-center gap-1"
                      >
                        <Heart className="w-4 h-4" /> Sponsor
                      </Link>
                    ) : null}
                  </div>
                </ComicPanel>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <TexturedSection variant="dark" texture="dots" className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-pop-gold mb-4">
            Want to Support These Projects?
          </h2>
          <p className="text-lg font-sans opacity-80 max-w-xl mx-auto mb-8">
            Your sponsorship helps bring these ideas to life and keeps the
            existing projects running and improving.
          </p>
          <Link to="/support">
            <PopButton variant="accent" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Become a Sponsor
            </PopButton>
          </Link>
        </div>
      </TexturedSection>
    </Layout>
  );
};

export default Projects;
