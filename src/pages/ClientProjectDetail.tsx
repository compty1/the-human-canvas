import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Calendar, Quote, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getProjectTypeLabel, getProjectTypeIcon } from "@/lib/clientProjectTypes";

const ClientProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["client-project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">This project doesn't exist or is not public.</p>
          <Link to="/client-work">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Client Work
            </PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const meta = project.type_metadata || {};
  const projectType = project.project_type || "web_design";

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <Link to="/client-work" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Client Work
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-foreground ${
              project.status === "completed" ? "bg-green-500 text-white" : "bg-yellow-400"
            }`}>
              {project.status === "completed" ? "Completed" : "In Progress"}
            </span>
            <span className="px-3 py-1 text-xs font-bold border-2 border-foreground bg-muted">
              {getProjectTypeIcon(projectType)} {getProjectTypeLabel(projectType)}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-2">
            {project.project_name}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            for {project.client_name}
          </p>
          
          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <Calendar className="w-4 h-4" />
              <span>
                {project.start_date && format(new Date(project.start_date), "MMM yyyy")}
                {project.start_date && project.end_date && " - "}
                {project.end_date && format(new Date(project.end_date), "MMM yyyy")}
              </span>
            </div>
          )}
          
          <p className="text-xl font-sans max-w-3xl text-muted-foreground">
            {project.description}
          </p>
        </div>
      </section>

      {/* Featured Image */}
      {project.image_url && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <ComicPanel className="overflow-hidden">
              <img 
                src={project.image_url} 
                alt={project.project_name}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </ComicPanel>
          </div>
        </section>
      )}

      {/* Long Description */}
      {project.long_description && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-display mb-8">About This Project</h2>
              <div className="prose prose-lg max-w-none font-sans">
                <p>{project.long_description}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Type-Specific Metadata */}
      {projectType === "logo_branding" && (meta.brand_colors?.length > 0 || meta.font_names?.length > 0) && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Brand Details</h2>
            <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
              {meta.brand_colors?.length > 0 && (
                <div>
                  <h3 className="font-display text-xl mb-4">Brand Colors</h3>
                  <div className="flex flex-wrap gap-3">
                    {meta.brand_colors.map((color: string) => (
                      <div key={color} className="flex items-center gap-2 p-2 bg-background border-2 border-foreground">
                        <div className="w-8 h-8 border border-foreground" style={{ backgroundColor: color }} />
                        <span className="font-mono text-sm">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {meta.font_names?.length > 0 && (
                <div>
                  <h3 className="font-display text-xl mb-4">Typography</h3>
                  <div className="space-y-2">
                    {meta.font_names.map((font: string) => (
                      <div key={font} className="p-2 bg-background border-2 border-foreground font-bold">{font}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {meta.logo_variations && (
              <p className="text-center mt-6 text-muted-foreground">{meta.logo_variations} logo variations delivered</p>
            )}
          </div>
        </section>
      )}

      {projectType === "copywriting" && (meta.content_type || meta.sample_excerpt) && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-display text-center mb-12">Content Details</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {meta.content_type && (
                <ComicPanel className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-display text-lg capitalize">{meta.content_type.replace("_", " ")}</div>
                </ComicPanel>
              )}
              {meta.word_count > 0 && (
                <ComicPanel className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Word Count</div>
                  <div className="font-display text-lg">{meta.word_count.toLocaleString()}</div>
                </ComicPanel>
              )}
              {meta.tone && (
                <ComicPanel className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Tone</div>
                  <div className="font-display text-lg">{meta.tone}</div>
                </ComicPanel>
              )}
            </div>
            {meta.sample_excerpt && (
              <ComicPanel className="p-6">
                <h3 className="font-display text-xl mb-3">Sample Excerpt</h3>
                <p className="font-sans italic text-muted-foreground">{meta.sample_excerpt}</p>
              </ComicPanel>
            )}
          </div>
        </section>
      )}

      {projectType === "business_plan" && (meta.industry || meta.sections?.length > 0) && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-display text-center mb-12">Business Plan Details</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {meta.industry && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Industry</div>
                  <div className="font-display text-lg">{meta.industry}</div>
                </ComicPanel>
              )}
              {meta.format && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Format</div>
                  <div className="font-display text-lg">{meta.format}</div>
                </ComicPanel>
              )}
            </div>
            {meta.executive_summary && (
              <ComicPanel className="p-6 mb-6">
                <h3 className="font-display text-xl mb-3">Executive Summary</h3>
                <p className="font-sans text-muted-foreground">{meta.executive_summary}</p>
              </ComicPanel>
            )}
            {meta.sections?.length > 0 && (
              <ComicPanel className="p-6">
                <h3 className="font-display text-xl mb-3">Key Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {meta.sections.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-background border-2 border-foreground font-bold text-sm">{s}</span>
                  ))}
                </div>
              </ComicPanel>
            )}
          </div>
        </section>
      )}

      {projectType === "consulting" && (meta.focus_area || meta.outcome_metrics) && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-display text-center mb-12">Consulting Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {meta.focus_area && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Focus Area</div>
                  <div className="font-display text-lg">{meta.focus_area}</div>
                </ComicPanel>
              )}
              {meta.duration && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-display text-lg">{meta.duration}</div>
                </ComicPanel>
              )}
              {meta.recommendations_count > 0 && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Recommendations</div>
                  <div className="font-display text-lg">{meta.recommendations_count}</div>
                </ComicPanel>
              )}
              {meta.outcome_metrics && (
                <ComicPanel className="p-4">
                  <div className="text-sm text-muted-foreground">Outcome</div>
                  <div className="font-display text-lg">{meta.outcome_metrics}</div>
                </ComicPanel>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {project.features && project.features.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {project.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-background border-2 border-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-sans">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots */}
      {project.screenshots && project.screenshots.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Screenshots</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {project.screenshots.map((screenshot: string, index: number) => (
                <ComicPanel key={index} className="overflow-hidden">
                  <img 
                    src={screenshot} 
                    alt={`${project.project_name} screenshot ${index + 1}`}
                    className="w-full h-auto"
                  />
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <section className="py-16 bg-foreground text-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-display text-pop-yellow mb-8">Tech Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {project.tech_stack.map((tech: string) => (
                <span 
                  key={tech}
                  className="px-4 py-2 bg-background text-foreground font-bold uppercase text-sm border-2 border-background"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      {project.testimonial && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <ComicPanel className="p-8 bg-pop-cyan/10">
                <Quote className="w-12 h-12 text-pop-cyan mb-4" />
                <blockquote className="text-2xl font-display mb-4">
                  "{project.testimonial}"
                </blockquote>
                {project.testimonial_author && (
                  <cite className="text-muted-foreground not-italic">
                    — {project.testimonial_author}
                  </cite>
                )}
              </ComicPanel>
            </div>
          </div>
        </section>
      )}

      {/* Back to Client Work */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/client-work">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Client Work
              </PopButton>
            </Link>
            <Link to="/contact">
              <PopButton variant="primary">
                Work With Me
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ClientProjectDetail;