import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { History, Star, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LifePeriod {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  themes: string[] | null;
  image_url: string | null;
  is_current: boolean;
  order_index: number;
  category: string | null;
}

const LifeTimeline = () => {
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["life-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_periods")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as LifePeriod[];
    },
  });

  const currentPeriod = periods.find(p => p.is_current);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Journey</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <History className="w-12 h-12" />
            Life & Art Timeline
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Important periods, themes, and transformations throughout the artistic journey.
          </p>
        </div>
      </section>

      {/* Current Period Highlight */}
      {currentPeriod && (
        <section className="py-12 bg-pop-yellow/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-pop-yellow" />
                <span className="font-bold uppercase text-sm">Current Period</span>
              </div>
              <Link to={`/timeline/${currentPeriod.id}`}>
                <ComicPanel className="p-6 hover:translate-y-[-4px] transition-transform">
                  <h2 className="text-3xl font-display mb-2">{currentPeriod.title}</h2>
                  <p className="text-muted-foreground mb-4">
                    Since {format(new Date(currentPeriod.start_date), "MMMM yyyy")}
                  </p>
                  {currentPeriod.description && (
                    <p className="text-lg mb-4">{currentPeriod.description}</p>
                  )}
                  {currentPeriod.themes && currentPeriod.themes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentPeriod.themes.map((theme) => (
                        <span key={theme} className="px-3 py-1 bg-pop-yellow font-bold">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </ComicPanel>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No Timeline Yet</h2>
              <p className="text-muted-foreground">Check back soon for the artist's journey.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-foreground hidden md:block" />

              <div className="space-y-12">
                {periods.map((period) => (
                  <div key={period.id} className="flex gap-8">
                    {/* Timeline dot */}
                    <div className="hidden md:flex flex-shrink-0 w-16 items-start justify-center">
                      <div className={`w-4 h-4 rounded-full border-4 border-foreground mt-8 ${
                        period.is_current ? "bg-pop-yellow" : "bg-background"
                      }`} />
                    </div>

                    <Link to={`/timeline/${period.id}`} className="flex-1">
                      <ComicPanel className="p-0 overflow-hidden hover:translate-x-2 transition-transform">
                        <div className="flex flex-col md:flex-row">
                          {period.image_url && (
                            <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden">
                               <img
                                src={period.image_url}
                                alt={period.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className={`flex-1 p-6 ${!period.image_url ? "w-full" : ""}`}>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              {format(new Date(period.start_date), "MMM yyyy")}
                              {period.end_date 
                                ? ` - ${format(new Date(period.end_date), "MMM yyyy")}`
                                : period.is_current ? " - Present" : ""
                              }
                              {period.is_current && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-pop-yellow ml-2">
                                  Current
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-display mb-2">{period.title}</h3>
                            {period.category && period.category !== "uncategorized" && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary capitalize mb-2 inline-block">
                                {period.category}
                              </span>
                            )}
                            
                            {period.description && (
                              <p className="text-muted-foreground mb-4 line-clamp-2">
                                {period.description}
                              </p>
                            )}

                            {period.themes && period.themes.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {period.themes.map((theme) => (
                                  <span key={theme} className="px-2 py-1 bg-muted text-sm font-bold">
                                    {theme}
                                  </span>
                                ))}
                              </div>
                            )}

                            <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                              Explore Period <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </ComicPanel>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default LifeTimeline;
