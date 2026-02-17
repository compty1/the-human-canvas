import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, History, Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

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
  created_at: string;
  category: string | null;
}

const LIFE_PERIOD_CATEGORIES = [
  "creative", "professional", "personal", "educational", "transitional", "uncategorized",
];

const LifePeriodsManager = () => {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["admin-life-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_periods")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as LifePeriod[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("life_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-life-periods"] });
      toast.success("Period deleted");
    },
  });

  const toggleCurrent = async (id: string, currentValue: boolean) => {
    // If setting as current, first unset any other current periods
    if (!currentValue) {
      await supabase
        .from("life_periods")
        .update({ is_current: false })
        .eq("is_current", true);
    }

    const { error } = await supabase
      .from("life_periods")
      .update({ is_current: !currentValue })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-life-periods"] });
      toast.success(currentValue ? "Unmarked as current" : "Marked as current period");
    }
  };

  const currentPeriod = periods.find(p => p.is_current);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display flex items-center gap-3">
              <History className="w-10 h-10" />
              Life Periods
            </h1>
            <p className="text-muted-foreground">Important times and themes throughout your artistic journey</p>
          </div>
          <Link to="/admin/life-periods/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Period
            </PopButton>
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${categoryFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-foreground hover:bg-muted"}`}
          >
            All
          </button>
          {LIFE_PERIOD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-sm font-bold border-2 transition-colors capitalize ${categoryFilter === cat ? "bg-primary text-primary-foreground border-primary" : "border-foreground hover:bg-muted"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Current Period Highlight */}
        {currentPeriod && (
          <ComicPanel className="p-6 bg-pop-yellow/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-pop-yellow" />
              <span className="font-bold uppercase text-sm">Current Period</span>
            </div>
            <h2 className="text-2xl font-display">{currentPeriod.title}</h2>
            <p className="text-muted-foreground">
              Since {format(new Date(currentPeriod.start_date), "MMMM yyyy")}
            </p>
            {currentPeriod.themes && currentPeriod.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentPeriod.themes.map((theme) => (
                  <span key={theme} className="px-2 py-1 bg-pop-yellow/30 font-bold text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </ComicPanel>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : periods.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No Life Periods Yet</h2>
            <p className="text-muted-foreground mb-6">Document important phases of your artistic journey</p>
            <Link to="/admin/life-periods/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add First Period
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-foreground hidden md:block" />
            
          <div className="space-y-6">
              {periods.filter(p => categoryFilter === "all" || (p.category || "uncategorized") === categoryFilter).map((period) => (
                <div key={period.id} className="flex gap-6">
                  {/* Timeline dot */}
                  <div className="hidden md:flex flex-shrink-0 w-16 items-start justify-center pt-4">
                    <div className={`w-4 h-4 rounded-full border-4 border-foreground ${
                      period.is_current ? "bg-pop-yellow" : "bg-background"
                    }`} />
                  </div>
                  
                  <ComicPanel className="flex-grow p-4">
                    <div className="flex items-start gap-4">
                      {period.image_url && (
                        <img
                          src={period.image_url}
                          alt={period.title}
                          className="w-24 h-24 object-cover border-2 border-foreground flex-shrink-0"
                        />
                      )}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(period.start_date), "MMM yyyy")}
                            {period.end_date 
                              ? ` - ${format(new Date(period.end_date), "MMM yyyy")}`
                              : period.is_current ? " - Present" : ""
                            }
                          </span>
                          {period.is_current && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-pop-yellow">Current</span>
                          )}
                        </div>
                        <h3 className="text-xl font-display">{period.title}</h3>
                        {period.category && period.category !== "uncategorized" && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary capitalize">
                            {period.category}
                          </span>
                        )}
                        {period.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{period.description}</p>
                        )}
                        {period.themes && period.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {period.themes.map((theme) => (
                              <span key={theme} className="px-2 py-0.5 text-xs bg-muted font-bold">
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          onClick={() => toggleCurrent(period.id, period.is_current)}
                          className={`p-2 border-2 border-foreground ${period.is_current ? "bg-pop-yellow" : "hover:bg-muted"}`}
                          title={period.is_current ? "Unmark as current" : "Set as current period"}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <Link to={`/admin/life-periods/${period.id}/edit`}>
                          <button className="p-2 border-2 border-foreground hover:bg-muted">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Delete this period?")) {
                              deleteMutation.mutate(period.id);
                            }
                          }}
                          className="p-2 border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </ComicPanel>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LifePeriodsManager;
