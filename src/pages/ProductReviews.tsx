import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowRight, AlertCircle, ThumbsUp, Wrench } from "lucide-react";

const ProductReviews = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["product-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const categories = reviews 
    ? ["all", ...new Set(reviews.map(r => r.category))]
    : ["all"];

  const filteredReviews = categoryFilter === "all" 
    ? reviews 
    : reviews?.filter(r => r.category === categoryFilter);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500";
    if (rating >= 6) return "bg-pop-yellow";
    if (rating >= 4) return "bg-pop-orange";
    return "bg-destructive";
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">UX Analysis</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Product Experience Reviews
          </h1>
          <p className="text-xl font-sans max-w-3xl text-muted-foreground">
            In-depth analysis of products and services from a user experience perspective. 
            Examining pain points, technical issues, strengths, and providing actionable 
            improvement suggestions for better products.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display text-pop-yellow text-center mb-8">
            Review Methodology
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Star, title: "User Experience", desc: "First impressions, daily usage, accessibility" },
              { icon: AlertCircle, title: "Pain Points", desc: "Frustrations and friction in the experience" },
              { icon: Wrench, title: "Technical Issues", desc: "Bugs, failures, and reliability problems" },
              { icon: ThumbsUp, title: "Improvements", desc: "Actionable suggestions for better UX" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <item.icon className="w-10 h-10 mx-auto mb-3 text-pop-cyan" />
                <h3 className="font-display text-lg mb-2">{item.title}</h3>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredReviews.map((review, index) => (
                <Link key={review.id} to={`/product-reviews/${review.slug}`}>
                  <ComicPanel className={`p-6 h-full flex flex-col animate-fade-in stagger-${(index % 5) + 1} hover:translate-y-[-4px] transition-transform`}>
                    {/* Rating Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground bg-muted">
                        {review.category}
                      </span>
                      <div className={`w-12 h-12 ${getRatingColor(review.overall_rating || 0)} flex items-center justify-center border-2 border-foreground`}>
                        <span className="text-xl font-display text-background">{review.overall_rating}</span>
                      </div>
                    </div>

                    {/* Title & Company */}
                    <h3 className="text-2xl font-display mb-1">{review.product_name}</h3>
                    <p className="text-sm font-bold text-muted-foreground mb-3">{review.company}</p>

                    {/* Summary */}
                    <p className="text-sm font-sans text-muted-foreground mb-4 flex-grow line-clamp-3">
                      {review.summary}
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-bold">
                      <div className="p-2 bg-destructive/10 border border-destructive/20">
                        <span className="text-destructive">{review.pain_points?.length || 0}</span>
                        <div className="text-muted-foreground">Pain Points</div>
                      </div>
                      <div className="p-2 bg-green-500/10 border border-green-500/20">
                        <span className="text-green-600">{review.strengths?.length || 0}</span>
                        <div className="text-muted-foreground">Strengths</div>
                      </div>
                      <div className="p-2 bg-primary/10 border border-primary/20">
                        <span className="text-primary">{review.improvement_suggestions?.length || 0}</span>
                        <div className="text-muted-foreground">Suggestions</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-bold pop-link">
                      Read Full Analysis <ArrowRight className="w-4 h-4" />
                    </div>
                  </ComicPanel>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No reviews found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-pop-magenta">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-background mb-4">
            Have a Product to Review?
          </h2>
          <p className="text-lg text-background/80 max-w-xl mx-auto mb-8">
            I provide detailed UX analysis for companies and products looking to 
            improve their user experience. Get actionable insights and recommendations.
          </p>
          <Link to="/about">
            <PopButton variant="accent" size="lg">
              Get in Touch
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default ProductReviews;
