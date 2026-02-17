import { useParams, Link } from "react-router-dom";
import { sanitizeHtml } from "@/lib/sanitize";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, Sparkles, Loader2 } from "lucide-react";

interface RelatedLink {
  title: string;
  url: string;
}

const InspirationDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: inspiration, isLoading, error } = useQuery({
    queryKey: ["inspiration", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspirations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  if (error || !inspiration) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Not Found</h1>
          <Link to="/inspirations">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inspirations
            </PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedLinks = Array.isArray(inspiration.related_links) 
    ? (inspiration.related_links as unknown as RelatedLink[])
    : [];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <Link to="/inspirations" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Inspirations
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1 text-sm font-bold uppercase bg-primary text-primary-foreground">
              {inspiration.category}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            {inspiration.title}
          </h1>
          
          {inspiration.description && (
            <p className="text-xl font-sans max-w-3xl text-muted-foreground">
              {inspiration.description}
            </p>
          )}
        </div>
      </section>

      {/* Image(s) */}
      {(inspiration.image_url || ((inspiration as Record<string, unknown>).images as string[] || []).length > 0) && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Cover Image */}
            {inspiration.image_url && (
              <ComicPanel className="overflow-hidden max-w-3xl mx-auto mb-6">
                <img 
                  src={inspiration.image_url} 
                  alt={inspiration.title}
                  className="w-full h-auto"
                />
              </ComicPanel>
            )}
            
            {/* Additional Images Gallery */}
            {((inspiration as Record<string, unknown>).images as string[] || []).length > 0 && (
              <div className="max-w-3xl mx-auto">
                <h3 className="text-lg font-display mb-4">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {((inspiration as Record<string, unknown>).images as string[]).map((img, idx) => (
                    <ComicPanel key={idx} className="overflow-hidden aspect-square">
                      <img 
                        src={img} 
                        alt={`${inspiration.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </ComicPanel>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Influence Areas */}
      {inspiration.influence_areas && inspiration.influence_areas.length > 0 && (
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-display mb-4">Areas of Influence</h2>
              <div className="flex flex-wrap gap-3">
                {inspiration.influence_areas.map((area) => (
                  <span key={area} className="px-4 py-2 bg-primary text-primary-foreground font-bold text-lg">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Content */}
      {inspiration.detailed_content && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div 
                className="prose prose-lg max-w-none font-sans"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(inspiration.detailed_content) }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Related Links */}
      {relatedLinks.length > 0 && (
        <section className="py-12 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display text-pop-yellow mb-6">Learn More</h2>
              <div className="space-y-3">
                {relatedLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border-2 border-background hover:bg-background/10 transition-colors"
                  >
                    <span className="font-bold">{link.title}</span>
                    <ExternalLink className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Back */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Link to="/inspirations">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Inspirations
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default InspirationDetail;
