import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Briefcase, 
  Palette, 
  Code, 
  Users, 
  ArrowRight, 
  Loader2,
  Calendar,
  CheckCircle,
  Sparkles
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  creative: Palette,
  business: Briefcase,
  technical: Code,
  service: Users,
  other: Sparkles,
};

const categoryColors: Record<string, string> = {
  creative: "bg-purple-500",
  business: "bg-blue-500",
  technical: "bg-green-500",
  service: "bg-orange-500",
  other: "bg-gray-500",
};

const categories = ["all", "creative", "business", "technical", "service", "other"];

const formatDateRange = (startDate?: string | null, endDate?: string | null, isOngoing?: boolean) => {
  if (!startDate) return null;
  const start = new Date(startDate).getFullYear();
  if (isOngoing) return `${start} - Present`;
  if (endDate) {
    const end = new Date(endDate).getFullYear();
    return start === end ? `${start}` : `${start} - ${end}`;
  }
  return `${start}`;
};

const Experiences = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredExperiences = activeCategory === "all"
    ? experiences
    : experiences.filter(e => e.category === activeCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Background</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <Briefcase className="w-12 h-12" />
            Experience
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            A collection of skills, projects, and professional experiences across creative, 
            business, technical, and service domains.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 border-b-2 border-foreground sticky top-16 bg-background z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const Icon = cat === "all" ? Briefcase : categoryIcons[cat];
              const count = cat === "all" 
                ? experiences.length 
                : experiences.filter(e => e.category === cat).length;
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
                  {cat === "all" ? "All" : cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No experiences in this category yet</h2>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((exp) => {
                const Icon = categoryIcons[exp.category] || Briefcase;
                const dateRange = formatDateRange(exp.start_date, exp.end_date, exp.is_ongoing);
                
                return (
                  <Link key={exp.id} to={`/experiences/${exp.slug}`}>
                    <ComicPanel className="h-full hover:-translate-y-1 transition-transform group overflow-hidden">
                      {/* Image */}
                      {exp.image_url && (
                        <div className="aspect-video overflow-hidden border-b-4 border-foreground">
                          <img
                            src={exp.image_url}
                            alt={exp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <div className="p-6">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-bold text-white flex items-center gap-1 ${categoryColors[exp.category]}`}>
                            <Icon className="w-3 h-3" />
                            {exp.category}
                          </span>
                          {exp.subcategory && (
                            <span className="px-2 py-1 text-xs font-bold bg-muted">
                              {exp.subcategory}
                            </span>
                          )}
                          {exp.is_ongoing && (
                            <span className="px-2 py-1 text-xs font-bold bg-green-500 text-white">
                              Ongoing
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-display mb-2">{exp.title}</h3>

                        {/* Date Range */}
                        {dateRange && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4" />
                            {dateRange}
                          </div>
                        )}

                        {/* Description */}
                        {exp.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {exp.description}
                          </p>
                        )}

                        {/* Skills Preview */}
                        {exp.skills_used && exp.skills_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {exp.skills_used.slice(0, 4).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 bg-muted text-xs font-bold">
                                {skill}
                              </span>
                            ))}
                            {exp.skills_used.length > 4 && (
                              <span className="px-2 py-0.5 bg-muted text-xs font-bold">
                                +{exp.skills_used.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Achievements Count */}
                        {exp.key_achievements && exp.key_achievements.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {exp.key_achievements.length} key achievement{exp.key_achievements.length !== 1 ? "s" : ""}
                          </div>
                        )}

                        {/* Link */}
                        <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                          Learn More <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </ComicPanel>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Experiences;
