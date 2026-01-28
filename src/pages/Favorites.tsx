import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Music, Film, Book, Palette, Users, Star, ExternalLink, Loader2, MapPin } from "lucide-react";

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
}

const typeIcons: Record<string, React.ElementType> = {
  art: Palette,
  music: Music,
  movie: Film,
  book: Book,
  creator: Users,
  article: Book,
  research: Book,
  other: Star,
};

const typeColors: Record<string, string> = {
  art: "bg-pink-500",
  music: "bg-purple-500",
  movie: "bg-red-500",
  book: "bg-blue-500",
  creator: "bg-green-500",
  article: "bg-orange-500",
  research: "bg-cyan-500",
  other: "bg-gray-500",
};

const types = ["all", "art", "music", "movie", "book", "article", "research", "creator", "other"];

const Favorites = () => {
  const [activeType, setActiveType] = useState("all");

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Favorite[];
    },
  });

  const currentlyEnjoying = favorites.filter(f => f.is_current);
  const creators = favorites.filter(f => f.type === "creator");
  const filteredFavorites = activeType === "all" 
    ? favorites 
    : favorites.filter(f => f.type === activeType);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Discoveries</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <Heart className="w-12 h-12" />
            Things I Enjoy
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Art, music, movies, articles, research, and creators that inspire, move, and fuel my work.
          </p>
        </div>
      </section>

      {/* Currently Enjoying */}
      {currentlyEnjoying.length > 0 && (
        <section className="py-12 bg-pop-yellow/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display mb-6 flex items-center gap-3">
              <Star className="w-8 h-8" /> Currently Enjoying
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentlyEnjoying.slice(0, 4).map((fav) => {
                const Icon = typeIcons[fav.type] || Star;
                return (
                  <ComicPanel key={fav.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`p-1 text-white ${typeColors[fav.type]}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{fav.type}</span>
                    </div>
                    <h3 className="font-display text-lg">{fav.title}</h3>
                    {fav.creator_name && (
                      <p className="text-sm text-muted-foreground">by {fav.creator_name}</p>
                    )}
                  </ComicPanel>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Type Filters */}
      <section className="py-8 border-b-2 border-foreground sticky top-16 bg-background z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {types.map((type) => {
              const Icon = type === "all" ? Heart : typeIcons[type];
              const count = type === "all" ? favorites.length : favorites.filter(f => f.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 font-bold text-sm uppercase flex items-center gap-2 border-2 transition-colors ${
                    activeType === type
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {type} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Favorites Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No favorites in this category yet</h2>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((fav) => {
                const Icon = typeIcons[fav.type] || Star;
                return (
                  <ComicPanel key={fav.id} className="p-0 overflow-hidden">
                    {fav.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={fav.image_url}
                          alt={fav.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1 ${typeColors[fav.type]}`}>
                          <Icon className="w-3 h-3" />
                          {fav.type}
                        </span>
                        {fav.is_current && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-pop-yellow">
                            Currently Enjoying
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-display mb-1">{fav.title}</h3>
                      
                      {fav.creator_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>by {fav.creator_name}</span>
                          {fav.creator_location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {fav.creator_location}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {fav.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {fav.description}
                        </p>
                      )}

                      {fav.impact_statement && (
                        <div className="p-3 bg-muted border-l-4 border-primary mb-3">
                          <p className="text-sm italic">"{fav.impact_statement}"</p>
                        </div>
                      )}

                      {fav.tags && fav.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {fav.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-muted font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {fav.source_url && (
                        <a 
                          href={fav.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="pop-link text-sm font-bold inline-flex items-center gap-1"
                        >
                          View Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </ComicPanel>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Creators Section */}
      {creators.length > 0 && activeType === "all" && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display mb-8 flex items-center gap-3">
              <Users className="w-8 h-8" /> Creators I Follow
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {creators.slice(0, 8).map((creator) => (
                <ComicPanel key={creator.id} className="p-4 text-center">
                  {creator.image_url && (
                    <img
                      src={creator.image_url}
                      alt={creator.title}
                      className="w-20 h-20 mx-auto mb-3 object-cover rounded-full border-4 border-foreground"
                    />
                  )}
                  <h3 className="font-display text-lg">{creator.title}</h3>
                  {creator.creator_location && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {creator.creator_location}
                    </p>
                  )}
                  {creator.creator_url && (
                    <a 
                      href={creator.creator_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pop-link text-xs mt-2 inline-block"
                    >
                      Visit
                    </a>
                  )}
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Favorites;
