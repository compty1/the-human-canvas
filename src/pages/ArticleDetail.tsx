import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton, PopButton } from "@/components/pop-art";
import { RichTextContent } from "@/components/editor/RichTextContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, Tag, ArrowLeft, Edit } from "lucide-react";
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

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
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

  const { data: relatedArticles } = useQuery({
    queryKey: ["related-articles", slug, article?.category],
    queryFn: async () => {
      if (!article) return [];
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, category, created_at")
        .eq("published", true)
        .eq("category", article.category)
        .neq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!article,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 bg-muted animate-pulse mb-4" />
            <div className="h-8 bg-muted animate-pulse mb-8 w-1/3" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This article doesn't exist or has been removed.
          </p>
          <Link to="/articles">
            <PopButton>Back to Articles</PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const category = article.category as WritingCategory;

  return (
    <Layout>
      <article>
        {/* Featured Image */}
        {article.featured_image && (
          <div className="relative h-[40vh] min-h-[300px] halftone-overlay border-b-4 border-foreground">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </Link>

            {/* Header */}
            <ComicPanel className="p-8 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`inline-block px-3 py-1 text-sm font-bold uppercase tracking-wide border-2 border-foreground ${categoryColors[category]}`}
                >
                  {categoryLabels[category]}
                </div>
                {isAdmin && (
                  <Link to={`/admin/articles/${article.id}/edit`}>
                    <PopButton size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </PopButton>
                  </Link>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-display mb-6">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(article.created_at), "MMMM d, yyyy")}
                </span>
                {article.reading_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {article.reading_time_minutes} min read
                  </span>
                )}
                {article.tags && article.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {article.tags.join(", ")}
                  </span>
                )}
              </div>
            </ComicPanel>

            {/* Content */}
            <div className="mb-12">
              {article.content ? (
                <RichTextContent content={article.content} />
              ) : (
                <p className="text-muted-foreground italic">
                  No content available.
                </p>
              )}
            </div>

            {/* Like Button */}
            <div className="flex justify-center mb-16">
              <LikeButton
                count={liked ? 1 : 0}
                liked={liked}
                onLike={() => setLiked(!liked)}
              />
            </div>

            {/* Related Articles */}
            {relatedArticles && relatedArticles.length > 0 && (
              <section className="border-t-4 border-foreground pt-12">
                <h2 className="text-2xl font-display mb-6">
                  More in {categoryLabels[category]}
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      to={`/articles/${item.slug}`}
                      className="block p-4 border-2 border-foreground hover:bg-muted transition-colors"
                    >
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy")}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticleDetail;
