import { useParams, Link } from "react-router-dom";
import { sanitizeHtml } from "@/lib/sanitize";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, SpeechBubble } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Star, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown,
  Wrench, 
  Lightbulb, 
  TrendingUp,
  MessageSquare,
  CheckCircle,
  XCircle
} from "lucide-react";

const ProductReviewDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: review, isLoading, error } = useQuery({
    queryKey: ["product-review", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-500";
    if (rating >= 6) return "bg-pop-yellow";
    if (rating >= 4) return "bg-pop-orange";
    return "bg-destructive";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return "Excellent";
    if (rating >= 6) return "Average";
    if (rating >= 4) return "Below Average";
    return "Poor";
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !review) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Review Not Found</h1>
          <p className="text-muted-foreground mb-8">The product review you're looking for doesn't exist.</p>
          <Link to="/product-reviews">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reviews
            </PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const uxAnalysis = review.user_experience_analysis as Record<string, string> || {};
  const userComplaints = review.user_complaints as Record<string, unknown> || {};

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <Link to="/product-reviews" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Reviews
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground bg-muted">
              {review.category}
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex-grow">
              <h1 className="text-5xl md:text-7xl font-display gradient-text mb-2">
                {review.product_name}
              </h1>
              <p className="text-2xl font-bold text-muted-foreground mb-6">
                by {review.company}
              </p>
            </div>
            
            {/* Rating Badge */}
            <div className="text-center">
              <div className={`w-24 h-24 ${getRatingColor(review.overall_rating || 0)} flex flex-col items-center justify-center border-4 border-foreground`}>
                <span className="text-4xl font-display text-background">{review.overall_rating}</span>
                <span className="text-xs font-bold text-background/80">/10</span>
              </div>
              <p className="text-sm font-bold mt-2">{getRatingLabel(review.overall_rating || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display mb-6">Executive Summary</h2>
            <SpeechBubble>
              <p className="text-lg font-sans">{review.summary}</p>
            </SpeechBubble>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-display text-destructive mb-2">{review.pain_points?.length || 0}</div>
              <div className="text-sm font-bold opacity-80">Pain Points</div>
            </div>
            <div>
              <div className="text-4xl font-display text-green-400 mb-2">{review.strengths?.length || 0}</div>
              <div className="text-sm font-bold opacity-80">Strengths</div>
            </div>
            <div>
              <div className="text-4xl font-display text-pop-orange mb-2">{review.technical_issues?.length || 0}</div>
              <div className="text-sm font-bold opacity-80">Technical Issues</div>
            </div>
            <div>
              <div className="text-4xl font-display text-pop-cyan mb-2">{review.improvement_suggestions?.length || 0}</div>
              <div className="text-sm font-bold opacity-80">Suggestions</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Experience Analysis */}
      {Object.keys(uxAnalysis).length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Star className="w-8 h-8 text-pop-yellow" />
                <h2 className="text-4xl font-display">User Experience Analysis</h2>
              </div>
              
              <div className="grid gap-6">
                {Object.entries(uxAnalysis).map(([key, value]) => (
                  <ComicPanel key={key} className="p-6">
                    <h3 className="text-xl font-display mb-3 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    <p className="font-sans text-muted-foreground">{value}</p>
                  </ComicPanel>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pain Points */}
      {review.pain_points && review.pain_points.length > 0 && (
        <section className="py-16 bg-destructive/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <ThumbsDown className="w-8 h-8 text-destructive" />
                <h2 className="text-4xl font-display">Pain Points & Frustrations</h2>
              </div>
              
              <div className="space-y-4">
                {review.pain_points.map((point, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background border-2 border-destructive/30">
                    <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="font-sans">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Strengths */}
      {review.strengths && review.strengths.length > 0 && (
        <section className="py-16 bg-green-500/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <ThumbsUp className="w-8 h-8 text-green-600" />
                <h2 className="text-4xl font-display">What Works Well</h2>
              </div>
              
              <div className="space-y-4">
                {review.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background border-2 border-green-500/30">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="font-sans">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Technical Issues */}
      {review.technical_issues && review.technical_issues.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Wrench className="w-8 h-8 text-pop-orange" />
                <h2 className="text-4xl font-display">Technical Issues & Failures</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {review.technical_issues.map((issue, index) => (
                  <ComicPanel key={index} className="p-4 bg-pop-orange/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-pop-orange flex-shrink-0 mt-0.5" />
                      <p className="font-sans text-sm">{issue}</p>
                    </div>
                  </ComicPanel>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Improvement Suggestions */}
      {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Lightbulb className="w-8 h-8 text-primary" />
                <h2 className="text-4xl font-display">Improvement Suggestions</h2>
              </div>
              
              <div className="space-y-4">
                {review.improvement_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background border-2 border-primary/30">
                    <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="font-sans">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Future Recommendations */}
      {review.future_recommendations && review.future_recommendations.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-8 h-8 text-pop-cyan" />
                <h2 className="text-4xl font-display">Future Recommendations</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {review.future_recommendations.map((rec, index) => (
                  <ComicPanel key={index} className="p-4 bg-pop-cyan/10">
                    <p className="font-sans text-sm">{rec}</p>
                  </ComicPanel>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* User Complaints Summary */}
      {Object.keys(userComplaints).length > 0 && (
        <section className="py-16 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-8 h-8 text-pop-yellow" />
                <h2 className="text-4xl font-display text-pop-yellow">User Complaints Summary</h2>
              </div>
              
              {userComplaints.common_themes && Array.isArray(userComplaints.common_themes) && (
                <div className="mb-8">
                  <h3 className="text-xl font-display mb-4">Common Themes</h3>
                  <ul className="space-y-2">
                    {(userComplaints.common_themes as string[]).map((theme, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-pop-yellow">•</span>
                        <span className="opacity-90">{theme}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {userComplaints.severity_breakdown && (
                <div className="mb-8">
                  <h3 className="text-xl font-display mb-4">Severity Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(userComplaints.severity_breakdown as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="p-4 border-2 border-background/30">
                        <div className="text-sm font-bold uppercase mb-1 capitalize">{key}</div>
                        <div className="text-sm opacity-80">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userComplaints.user_sentiment && (
                <div className="p-6 border-2 border-pop-yellow">
                  <h3 className="text-xl font-display text-pop-yellow mb-3">Overall User Sentiment</h3>
                  <p className="opacity-90">{userComplaints.user_sentiment as string}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Full Content */}
      {review.content && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-display mb-8">Full Analysis</h2>
              <div 
                className="prose prose-lg max-w-none font-sans"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(review.content) }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Navigation Footer */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/product-reviews">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Reviews
              </PopButton>
            </Link>
            <Link to="/about">
              <PopButton variant="primary">
                Request a Review
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductReviewDetail;
