import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, User, Lightbulb, Compass, Heart, ArrowRight, Loader2, TreeDeciduous } from "lucide-react";

interface Inspiration {
  id: string;
  title: string;
  category: string;
  description: string | null;
  detailed_content: string | null;
  image_url: string | null;
  influence_areas: string[] | null;
  order_index: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  person: User,
  concept: Lightbulb,
  movement: Compass,
  experience: Heart,
};

const categoryColors: Record<string, string> = {
  person: "bg-blue-500",
  concept: "bg-purple-500",
  movement: "bg-green-500",
  experience: "bg-orange-500",
};

const categories = ["all", "person", "concept", "movement", "experience"];

const Inspirations = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: inspirations = [], isLoading } = useQuery({
    queryKey: ["inspirations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspirations")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Inspiration[];
    },
  });

  // Fetch childhood roots from favorites
  const { data: childhoodRoots = [] } = useQuery({
    queryKey: ["childhood-roots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("is_childhood_root", true)
        .order("created_at", { ascending: true })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const filteredInspirations = activeCategory === "all"
    ? inspirations
    : inspirations.filter(i => i.category === activeCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">The Source</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <Sparkles className="w-12 h-12" />
            Inspirations
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            The people, concepts, movements, and experiences that shape my work and worldview.
          </p>
        </div>
      </section>

      {/* What Inspires */}
      <section className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display text-pop-yellow mb-6">What Fuels Creation?</h2>
          <p className="text-lg max-w-2xl mx-auto opacity-80">
            Every piece of art, every project, every word written is influenced by something greater. 
            These are the wellsprings from which creativity flows - the teachers, ideas, 
            struggles, and moments that continue to shape the work.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b-2 border-foreground sticky top-16 bg-background z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const Icon = cat === "all" ? Sparkles : categoryIcons[cat];
              const count = cat === "all" ? inspirations.length : inspirations.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 font-bold text-sm uppercase flex items-center gap-2 border-2 transition-colors ${
                    activeCategory === cat
                      ? cat === "all" 
                        ? "bg-foreground text-background border-foreground"
                        : `${categoryColors[cat]} text-white border-foreground`
                      : "border-foreground hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {cat === "all" ? "All" : `${cat}s`} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inspirations List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredInspirations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No inspirations in this category yet</h2>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {filteredInspirations.map((insp, index) => {
                const Icon = categoryIcons[insp.category] || Sparkles;
                return (
                  <Link key={insp.id} to={`/inspirations/${insp.id}`}>
                    <ComicPanel className="p-0 overflow-hidden hover:translate-x-2 transition-transform">
                      <div className="flex flex-col md:flex-row">
                        {insp.image_url && (
                          <div className="md:w-1/3 aspect-square md:aspect-auto overflow-hidden">
                            <img
                              src={insp.image_url}
                              alt={insp.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className={`flex-1 p-6 ${!insp.image_url ? "w-full" : ""}`}>
                          <div className="flex items-center gap-3 mb-3">
                             <span className="text-2xl font-display text-muted-foreground">
                              #{insp.order_index ?? index + 1}
                            </span>
                            <span className={`px-2 py-1 text-xs font-bold text-white flex items-center gap-1 ${categoryColors[insp.category]}`}>
                              <Icon className="w-3 h-3" />
                              {insp.category}
                            </span>
                          </div>

                          <h3 className="text-3xl font-display mb-3">{insp.title}</h3>
                          
                          {insp.description && (
                            <p className="text-muted-foreground mb-4 line-clamp-3">
                              {insp.description}
                            </p>
                          )}

                          {insp.influence_areas && insp.influence_areas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {insp.influence_areas.map((area) => (
                                <span key={area} className="px-3 py-1 bg-muted text-sm font-bold">
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}

                          <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                            Explore <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </ComicPanel>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Roots Section - Childhood Favorites */}
      {childhoodRoots.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background font-bold mb-4">
                <TreeDeciduous className="w-5 h-5" />
                Roots
              </div>
              <h2 className="text-4xl font-display mb-4">Formative Influences</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                The media, stories, and experiences from childhood that shaped who I am today.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {childhoodRoots.map((root) => (
                <Link key={root.id} to={`/favorites/${root.id}`}>
                  <ComicPanel className="h-full hover:-translate-y-1 transition-transform p-0 overflow-hidden">
                    {root.image_url && (
                      <div className="aspect-video overflow-hidden border-b-4 border-foreground">
                        <img src={root.image_url} alt={root.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{root.type}</span>
                      {root.childhood_age_range && (
                        <span className="text-xs font-bold text-pop-magenta ml-2">Age {root.childhood_age_range}</span>
                      )}
                      <h3 className="text-xl font-display mt-1">{root.title}</h3>
                      {root.childhood_impact && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{root.childhood_impact}</p>
                      )}
                    </div>
                  </ComicPanel>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Inspirations;
