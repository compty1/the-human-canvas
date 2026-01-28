import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, MapPin, Calendar, Heart, Loader2 } from "lucide-react";
import { format } from "date-fns";

const FavoriteDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: favorite, isLoading, error } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
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

  if (error || !favorite) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Not Found</h1>
          <Link to="/favorites">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Favorites
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
          <Link to="/favorites" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Favorites
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1 text-sm font-bold uppercase bg-primary text-primary-foreground">
              {favorite.type}
            </span>
            {favorite.is_current && (
              <span className="px-3 py-1 text-sm font-bold bg-pop-yellow">
                Currently Enjoying
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-4">
            {favorite.title}
          </h1>
          
          {favorite.creator_name && (
            <p className="text-xl text-muted-foreground mb-2">
              by {favorite.creator_name}
              {favorite.creator_location && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <MapPin className="w-4 h-4" />
                  {favorite.creator_location}
                </span>
              )}
            </p>
          )}

          {favorite.discovered_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Discovered {format(new Date(favorite.discovered_date), "MMMM yyyy")}
            </p>
          )}
        </div>
      </section>

      {/* Image */}
      {favorite.image_url && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <ComicPanel className="overflow-hidden max-w-3xl mx-auto">
              <img 
                src={favorite.image_url} 
                alt={favorite.title}
                className="w-full h-auto"
              />
            </ComicPanel>
          </div>
        </section>
      )}

      {/* Description */}
      {favorite.description && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display mb-6">About</h2>
              <p className="text-lg font-sans">{favorite.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Impact Statement */}
      {favorite.impact_statement && (
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <ComicPanel className="p-8">
                <Heart className="w-8 h-8 text-primary mb-4" />
                <h2 className="text-2xl font-display mb-4">How It Affected Me</h2>
                <p className="text-lg font-sans italic">"{favorite.impact_statement}"</p>
              </ComicPanel>
            </div>
          </div>
        </section>
      )}

      {/* Tags */}
      {favorite.tags && favorite.tags.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-display mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {favorite.tags.map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-muted border-2 border-foreground font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Links */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {favorite.source_url && (
              <a href={favorite.source_url} target="_blank" rel="noopener noreferrer">
                <PopButton variant="primary">
                  <ExternalLink className="w-4 h-4 mr-2" /> View Source
                </PopButton>
              </a>
            )}
            {favorite.creator_url && (
              <a href={favorite.creator_url} target="_blank" rel="noopener noreferrer">
                <PopButton variant="secondary">
                  Visit Creator
                </PopButton>
              </a>
            )}
            <Link to="/favorites">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Favorites
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FavoriteDetail;
