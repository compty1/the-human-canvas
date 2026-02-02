import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, MapPin, Calendar, Heart, Loader2, Music, Film } from "lucide-react";
import { format } from "date-fns";
import { streamingPlatforms, getAvailableStreamingLinks } from "@/lib/streamingPlatforms";

interface Favorite {
  id: string;
  title: string;
  type: string;
  source_url: string | null;
  image_url: string | null;
  creator_name: string | null;
  creator_url: string | null;
  creator_location: string | null;
  description: string | null;
  impact_statement: string | null;
  is_current: boolean;
  tags: string[] | null;
  discovered_date: string | null;
  streaming_links: Record<string, string> | null;
  media_subtype: string | null;
  release_year: number | null;
  season_count: number | null;
  album_name: string | null;
  artist_name: string | null;
}

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
      return data as Favorite | null;
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

  const streamingLinks = getAvailableStreamingLinks(favorite.streaming_links);
  const isMusicType = favorite.type === 'music';
  const isVideoType = favorite.type === 'movie' || favorite.type === 'show';
  const hasStreamingLinks = streamingLinks.length > 0;

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
            {favorite.media_subtype && (
              <span className="px-3 py-1 text-sm font-bold uppercase bg-muted capitalize">
                {favorite.media_subtype}
              </span>
            )}
            {favorite.release_year && (
              <span className="px-3 py-1 text-sm font-bold bg-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {favorite.release_year}
              </span>
            )}
            {favorite.is_current && (
              <span className="px-3 py-1 text-sm font-bold bg-pop-yellow">
                Currently Enjoying
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-4">
            {favorite.title}
          </h1>
          
          {(favorite.artist_name || favorite.creator_name) && (
            <p className="text-xl text-muted-foreground mb-2">
              by {favorite.artist_name || favorite.creator_name}
              {favorite.creator_location && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <MapPin className="w-4 h-4" />
                  {favorite.creator_location}
                </span>
              )}
            </p>
          )}

          {favorite.album_name && (
            <p className="text-lg text-muted-foreground mb-2">
              from the album <span className="font-bold">{favorite.album_name}</span>
            </p>
          )}

          {favorite.season_count && (
            <p className="text-lg text-muted-foreground mb-2">
              {favorite.season_count} {favorite.season_count === 1 ? 'Season' : 'Seasons'}
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

      {/* Where to Watch/Listen */}
      {hasStreamingLinks && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <ComicPanel className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  {isMusicType ? (
                    <Music className="w-6 h-6 text-primary" />
                  ) : (
                    <Film className="w-6 h-6 text-primary" />
                  )}
                  <h2 className="text-2xl font-display">
                    {isMusicType ? 'Listen On' : 'Where to Watch'}
                  </h2>
                </div>
                <div className="grid gap-3">
                  {streamingLinks.map(({ key, url, platform }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 border-2 border-foreground hover:bg-muted transition-colors group"
                      style={{ borderLeftColor: platform.color, borderLeftWidth: '4px' }}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <div className="flex-1">
                        <span className="font-bold">{platform.name}</span>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {url}
                        </p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  ))}
                </div>
              </ComicPanel>
            </div>
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
