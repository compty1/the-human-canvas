import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Calendar, ExternalLink, Quote, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
      return data;
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

      {/* Features */}
      {project.features && project.features.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {project.features.map((feature, index) => (
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
              {project.screenshots.map((screenshot, index) => (
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
              {project.tech_stack.map((tech) => (
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
