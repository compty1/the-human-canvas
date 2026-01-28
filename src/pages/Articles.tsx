import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, Tag, Plus } from "lucide-react";
import { format } from "date-fns";

type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: WritingCategory;
  tags: string[] | null;
  reading_time_minutes: number | null;
  published: boolean | null;
  featured_image: string | null;
  created_at: string;
}

const categoryLabels: Record<WritingCategory, string> = {
  philosophy: "Philosophy",
  narrative: "Narrative",
  cultural: "Cultural",
  ux_review: "UX Review",
  research: "Research",
};

const categoryColors: Record<WritingCategory, string> = {
  philosophy: "bg-pop-magenta",
  narrative: "bg-pop-cyan",
  cultural: "bg-pop-yellow text-foreground",
  ux_review: "bg-secondary",
  research: "bg-pop-orange",
};

const Articles = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<WritingCategory | "all">("all");
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const categories: { id: WritingCategory | "all"; label: string }[] = [
    { id: "all", label: "All Articles" },
    { id: "philosophy", label: "Philosophy" },
    { id: "narrative", label: "Narrative" },
    { id: "cultural", label: "Cultural" },
    { id: "ux_review", label: "UX Reviews" },
    { id: "research", label: "Research" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="caption-box inline-block mb-4">Deep Dives</div>
              <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
                Articles
              </h1>
              <p className="text-xl font-sans max-w-2xl text-muted-foreground">
                Long-form essays, philosophical explorations, cultural commentary,
                UX case studies, and narrative stories about the human experience.
              </p>
            </div>
            {isAdmin && (
              <Link to="/admin/articles/new">
                <PopButton size="sm" variant="primary">
                  <Plus className="w-4 h-4 mr-1" />
                  New Article
                </PopButton>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-muted border-4 border-foreground animate-pulse"
                />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <ComicPanel
                  key={article.id}
                  className={`p-0 overflow-hidden animate-fade-in stagger-${(index % 5) + 1}`}
                >
                  {article.featured_image && (
                    <div className="halftone-overlay h-48 overflow-hidden border-b-2 border-foreground">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div
                      className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground mb-3 ${
                        categoryColors[article.category]
                      }`}
                    >
                      {categoryLabels[article.category]}
                    </div>

                    <Link to={`/articles/${article.slug}`}>
                      <h2 className="text-xl font-display mb-3 hover:text-primary transition-colors">
                        {article.title}
                      </h2>
                    </Link>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(article.created_at), "MMM d")}
                      </span>
                      {article.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.reading_time_minutes} min
                        </span>
                      )}
                    </div>

                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground font-sans mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <Link
                        to={`/articles/${article.slug}`}
                        className="font-bold text-primary hover:underline text-sm"
                      >
                        Read more →
                      </Link>
                      <LikeButton
                        count={likedItems.has(article.id) ? 1 : 0}
                        liked={likedItems.has(article.id)}
                        onLike={() => toggleLike(article.id)}
                      />
                    </div>
                  </div>
                </ComicPanel>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="speech-bubble inline-block">
                <p className="text-xl">No articles in this category yet.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Articles;
