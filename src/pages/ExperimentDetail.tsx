import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, SpeechBubble } from "@/components/pop-art";
import { ProductGallery } from "@/components/experiments/ProductGallery";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, TrendingUp, Calendar, Package, DollarSign, Target, Lightbulb } from "lucide-react";

const ExperimentDetail = () => {
  const { slug } = useParams();

  const { data: experiment, isLoading } = useQuery({
    queryKey: ["experiment", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted" />
            <div className="h-64 bg-muted" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!experiment) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-display mb-4">Not Found</h1>
          <Link to="/experiments" className="text-primary hover:underline">
            Back to Experiments
          </Link>
        </div>
      </Layout>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-pop-green",
    paused: "bg-pop-yellow",
    closed: "bg-muted",
    sold: "bg-pop-cyan",
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/experiments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-lg font-bold text-muted-foreground">{experiment.platform}</span>
            <span
              className={`px-3 py-1 text-sm font-bold uppercase ${statusColors[experiment.status]}`}
            >
              {experiment.status}
            </span>
          </div>
          <h1 className="text-5xl font-display mb-4">{experiment.name}</h1>
          {experiment.description && (
            <p className="text-xl text-muted-foreground">{experiment.description}</p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            {experiment.image_url && (
              <ComicPanel className="overflow-hidden">
                <img
                  src={experiment.image_url}
                  alt={experiment.name}
                  className="w-full aspect-video object-cover"
                />
              </ComicPanel>
            )}

            {/* Long Description */}
            {experiment.long_description && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">About This Venture</h2>
                <div className="prose prose-lg max-w-none">
                  {experiment.long_description.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </ComicPanel>
            )}

            {/* Operation Details */}
            {experiment.operation_details && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Operations</h2>
                <p className="whitespace-pre-wrap">{experiment.operation_details}</p>
              </ComicPanel>
            )}

            {/* Management Info */}
            {experiment.management_info && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Management Approach</h2>
                <p className="whitespace-pre-wrap">{experiment.management_info}</p>
              </ComicPanel>
            )}

            {/* Products Offered */}
            {experiment.products_offered && experiment.products_offered.length > 0 && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Products Offered</h2>
                <ul className="space-y-2">
                  {experiment.products_offered.map((product, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Package className="w-4 h-4 mt-1 text-primary" />
                      <span>{product}</span>
                    </li>
                  ))}
                </ul>
              </ComicPanel>
            )}

            {/* Product Gallery - shows actual products with images */}
            <ProductGallery experimentId={experiment.id} />

            {/* Sample Reviews */}
            {experiment.sample_reviews && experiment.sample_reviews.length > 0 && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Customer Reviews</h2>
                <div className="space-y-4">
                  {experiment.sample_reviews.map((review, i) => (
                    <div key={i} className="p-4 bg-muted border-l-4 border-pop-yellow">
                      <p className="italic">"{review}"</p>
                    </div>
                  ))}
                </div>
              </ComicPanel>
            )}

            {/* Lessons Learned */}
            {experiment.lessons_learned && experiment.lessons_learned.length > 0 && (
              <ComicPanel className="p-6 bg-pop-yellow/10">
                <h2 className="text-2xl font-display mb-4 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6" />
                  Key Lessons
                </h2>
                <ul className="space-y-3">
                  {experiment.lessons_learned.map((lesson, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ul>
              </ComicPanel>
            )}

            {/* Case Study */}
            {experiment.case_study && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Case Study</h2>
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: experiment.case_study }}
                />
              </ComicPanel>
            )}

            {/* Screenshots */}
            {experiment.screenshots && experiment.screenshots.length > 0 && (
              <ComicPanel className="p-6">
                <h2 className="text-2xl font-display mb-4">Screenshots</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {experiment.screenshots.map((url, i) => (
                    <div key={i} className="border-2 border-foreground overflow-hidden">
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-full" />
                    </div>
                  ))}
                </div>
              </ComicPanel>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <ComicPanel className="p-6">
              <h3 className="font-display text-xl mb-4">Performance</h3>
              <div className="space-y-4">
                {/* Duration */}
                {experiment.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="font-bold">
                      {new Date(experiment.start_date).toLocaleDateString()}
                      {experiment.end_date
                        ? ` - ${new Date(experiment.end_date).toLocaleDateString()}`
                        : " - Present"}
                    </span>
                  </div>
                )}

                {/* Rating */}
                {experiment.average_rating && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Star className="w-4 h-4" />
                      Rating
                    </span>
                    <span className="font-bold">
                      {experiment.average_rating}/5
                      {experiment.review_count && (
                        <span className="text-muted-foreground ml-1">
                          ({experiment.review_count} reviews)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Orders */}
                {experiment.total_orders > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-4 h-4" />
                      Total Orders
                    </span>
                    <span className="font-bold">{experiment.total_orders.toLocaleString()}</span>
                  </div>
                )}

                {/* Products Sold */}
                {experiment.products_sold > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Products Sold
                    </span>
                    <span className="font-bold">{experiment.products_sold.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </ComicPanel>

            {/* Financials */}
            {(experiment.revenue > 0 || experiment.costs > 0) && (
              <ComicPanel className="p-6 bg-pop-green/10">
                <h3 className="font-display text-xl mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financials
                </h3>
                <div className="space-y-3">
                  {experiment.revenue > 0 && (
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-bold text-pop-green">
                        ${experiment.revenue.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {experiment.costs > 0 && (
                    <div className="flex justify-between">
                      <span>Costs</span>
                      <span className="font-bold text-destructive">
                        ${experiment.costs.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {experiment.profit !== 0 && (
                    <div className="flex justify-between pt-2 border-t-2 border-foreground">
                      <span className="font-bold">Profit</span>
                      <span
                        className={`font-bold ${
                          experiment.profit >= 0 ? "text-pop-green" : "text-destructive"
                        }`}
                      >
                        ${experiment.profit.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </ComicPanel>
            )}

            {/* Skills */}
            {experiment.skills_demonstrated && experiment.skills_demonstrated.length > 0 && (
              <ComicPanel className="p-6">
                <h3 className="font-display text-xl mb-4">Skills Demonstrated</h3>
                <div className="flex flex-wrap gap-2">
                  {experiment.skills_demonstrated.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </ComicPanel>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExperimentDetail;
