import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, SpeechBubble } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Star, TrendingUp, Calendar, Package } from "lucide-react";

const Experiments = () => {
  const { data: experiments, isLoading } = useQuery({
    queryKey: ["experiments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .neq("status", "draft")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-pop-green text-foreground",
    paused: "bg-pop-yellow text-foreground",
    closed: "bg-muted text-muted-foreground",
    sold: "bg-pop-cyan text-foreground",
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <SpeechBubble className="inline-block mb-4">
            Business Experiments!
          </SpeechBubble>
          <h1 className="text-5xl font-display mb-4">My Ventures</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A showcase of businesses I've built and operated. Each experiment taught me valuable
            lessons about entrepreneurship, product development, and customer service.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="h-32 bg-muted/50 mt-2" />
              </div>
            ))}
          </div>
        ) : experiments && experiments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiments.map((exp) => (
              <Link key={exp.id} to={`/experiments/${exp.slug}`}>
                <ComicPanel className="h-full hover:-translate-y-1 transition-transform">
                  {exp.image_url && (
                    <div className="aspect-video overflow-hidden border-b-4 border-foreground">
                      <img
                        src={exp.image_url}
                        alt={exp.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-muted-foreground">{exp.platform}</span>
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase ${
                          statusColors[exp.status] || "bg-muted"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-display mb-2">{exp.name}</h3>
                    
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {exp.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {exp.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-pop-yellow" />
                          <span>{exp.average_rating}/5</span>
                          {exp.review_count && (
                            <span className="text-muted-foreground">({exp.review_count})</span>
                          )}
                        </div>
                      )}
                      {exp.revenue > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-pop-green" />
                          <span>${exp.revenue.toLocaleString()}</span>
                        </div>
                      )}
                      {exp.total_orders > 0 && (
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>{exp.total_orders} orders</span>
                        </div>
                      )}
                      {exp.start_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(exp.start_date).getFullYear()}</span>
                          {exp.end_date && (
                            <span>- {new Date(exp.end_date).getFullYear()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ComicPanel>
              </Link>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-8 text-center">
            <p className="text-muted-foreground">No experiments to show yet.</p>
          </ComicPanel>
        )}
      </div>
    </Layout>
  );
};

export default Experiments;
