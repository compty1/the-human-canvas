import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research";

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

const Writing = () => {
  // Fetch recent updates
  const { data: recentUpdates } = useQuery({
    queryKey: ["recent-updates-hub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  // Fetch featured articles
  const { data: featuredArticles } = useQuery({
    queryKey: ["featured-articles-hub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Written Word</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Writing
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            From quick thoughts to deep dives — exploring philosophy, culture,
            the human experience, and the artifacts we leave behind.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-12 border-y-4 border-foreground bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/updates" className="block">
              <ComicPanel className="p-8 h-full hover:translate-y-[-4px] transition-transform">
                <div className="caption-box inline-block mb-4 bg-pop-cyan">
                  Quick Notes
                </div>
                <h2 className="text-3xl font-display mb-4">Updates</h2>
                <p className="text-muted-foreground mb-4">
                  Short-form thoughts, observations, work-in-progress notes, and
                  brief commentary on topics.
                </p>
                <span className="font-bold text-primary flex items-center gap-2">
                  View Updates <ArrowRight className="w-4 h-4" />
                </span>
              </ComicPanel>
            </Link>

            <Link to="/articles" className="block">
              <ComicPanel className="p-8 h-full hover:translate-y-[-4px] transition-transform">
                <div className="caption-box inline-block mb-4 bg-pop-magenta">
                  Deep Dives
                </div>
                <h2 className="text-3xl font-display mb-4">Articles</h2>
                <p className="text-muted-foreground mb-4">
                  Long-form essays on philosophy, cultural commentary, UX case
                  studies, and narrative stories.
                </p>
                <span className="font-bold text-primary flex items-center gap-2">
                  View Articles <ArrowRight className="w-4 h-4" />
                </span>
              </ComicPanel>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Updates */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-display">Latest Updates</h2>
            <Link to="/updates">
              <PopButton size="sm" variant="secondary">
                View All
              </PopButton>
            </Link>
          </div>

          {recentUpdates && recentUpdates.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {recentUpdates.map((update, index) => (
                <ComicPanel
                  key={update.id}
                  className={`p-6 animate-fade-in stagger-${index + 1}`}
                >
                  <Link to={`/updates/${update.slug}`}>
                    <h3 className="text-xl font-display mb-2 hover:text-primary transition-colors">
                      {update.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(update.created_at), "MMM d, yyyy")}
                  </p>
                  {update.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {update.excerpt}
                    </p>
                  )}
                </ComicPanel>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No updates yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-display text-pop-yellow">
              Featured Articles
            </h2>
            <Link to="/articles">
              <PopButton size="sm" variant="accent">
                View All
              </PopButton>
            </Link>
          </div>

          {featuredArticles && featuredArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className={`block p-6 border-2 border-background hover:bg-background/10 transition-colors animate-fade-in stagger-${index + 1}`}
                >
                  <div
                    className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide mb-3 ${
                      categoryColors[article.category as WritingCategory]
                    }`}
                  >
                    {categoryLabels[article.category as WritingCategory]}
                  </div>
                  <h3 className="text-xl font-display mb-2">{article.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-background/70 mb-3">
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
                    <p className="text-background/70 text-sm line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-background/70">No articles yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Philosophy Statement */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-display mb-8">Why I Write</h2>
            <div className="speech-bubble text-left">
              <p className="text-lg font-sans leading-relaxed">
                "Writing is how I process the human experience. Every essay is
                an artifact — a document of thought at a specific moment in
                time. Future beings discovering these words would learn how we
                grappled with existence, identity, and meaning. Philosophy,
                narrative, cultural commentary — all channels for understanding
                ourselves and the world we're creating."
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Writing;
