import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";

const LifePeriodDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: period, isLoading, error } = useQuery({
    queryKey: ["life-period", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_periods")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch key works if any
  const { data: keyArtworks = [] } = useQuery({
    queryKey: ["period-artworks", period?.key_works],
    queryFn: async () => {
      if (!period?.key_works || period.key_works.length === 0) return [];
      const { data, error } = await supabase
        .from("artwork")
        .select("id, title, image_url")
        .in("id", period.key_works);
      if (error) throw error;
      return data;
    },
    enabled: !!period?.key_works && period.key_works.length > 0,
  });

  const { data: keyProjects = [] } = useQuery({
    queryKey: ["period-projects", period?.key_works],
    queryFn: async () => {
      if (!period?.key_works || period.key_works.length === 0) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, image_url, slug")
        .in("id", period.key_works);
      if (error) throw error;
      return data;
    },
    enabled: !!period?.key_works && period.key_works.length > 0,
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

  if (error || !period) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Not Found</h1>
          <Link to="/timeline">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Timeline
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
          <Link to="/timeline" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Timeline
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {period.is_current && (
              <span className="px-3 py-1 text-sm font-bold bg-pop-yellow flex items-center gap-2">
                <Star className="w-4 h-4" /> Current Period
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-4">
            {period.title}
          </h1>
          
          <div className="flex items-center gap-2 text-xl text-muted-foreground">
            <Calendar className="w-5 h-5" />
            {format(new Date(period.start_date), "MMMM yyyy")}
            {period.end_date 
              ? ` - ${format(new Date(period.end_date), "MMMM yyyy")}`
              : period.is_current ? " - Present" : ""
            }
          </div>
        </div>
      </section>

      {/* Image */}
      {period.image_url && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <ComicPanel className="overflow-hidden max-w-3xl mx-auto">
              <img 
                src={period.image_url} 
                alt={period.title}
                className="w-full h-auto"
              />
            </ComicPanel>
          </div>
        </section>
      )}

      {/* Themes */}
      {period.themes && period.themes.length > 0 && (
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-display mb-4">Themes</h2>
              <div className="flex flex-wrap gap-3">
                {period.themes.map((theme) => (
                  <span key={theme} className="px-4 py-2 bg-primary text-primary-foreground font-bold text-lg">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {period.description && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display mb-6">Overview</h2>
              <p className="text-xl font-sans text-muted-foreground">{period.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Content */}
      {period.detailed_content && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div 
                className="prose prose-lg max-w-none font-sans"
                dangerouslySetInnerHTML={{ __html: period.detailed_content }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Key Works */}
      {(keyArtworks.length > 0 || keyProjects.length > 0) && (
        <section className="py-16 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-pop-yellow text-center mb-12">
              Key Works from This Period
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {keyArtworks.map((art) => (
                <ComicPanel key={art.id} className="p-0 overflow-hidden bg-background text-foreground">
                  {art.image_url && (
                    <div className="aspect-square overflow-hidden">
                      <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-lg">{art.title}</h3>
                    <span className="text-xs text-muted-foreground">Artwork</span>
                  </div>
                </ComicPanel>
              ))}
              {keyProjects.map((proj) => (
                <Link key={proj.id} to={`/projects/${proj.slug}`}>
                  <ComicPanel className="p-0 overflow-hidden bg-background text-foreground hover:translate-y-[-4px] transition-transform">
                    {proj.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={proj.image_url} alt={proj.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-display text-lg">{proj.title}</h3>
                      <span className="text-xs text-muted-foreground">Project</span>
                    </div>
                  </ComicPanel>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Link to="/timeline">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Full Timeline
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LifePeriodDetail;
