import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Briefcase, 
  Palette, 
  Code, 
  Users,
  Calendar,
  CheckCircle,
  Lightbulb,
  Target,
  Wrench,
  TrendingUp,
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

const formatDateRange = (startDate?: string | null, endDate?: string | null, isOngoing?: boolean) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (isOngoing) return `${startStr} - Present`;
  if (endDate) {
    const end = new Date(endDate);
    const endStr = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }
  return startStr;
};

const ExperienceDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ["experience", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

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

  if (error || !experience) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Experience Not Found</h1>
          <p className="text-muted-foreground mb-8">The experience you're looking for doesn't exist.</p>
          <Link to="/experiences">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiences
            </PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const Icon = categoryIcons[experience.category] || Briefcase;
  const dateRange = formatDateRange(experience.start_date, experience.end_date, experience.is_ongoing);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <Link to="/experiences" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Experiences
          </Link>

          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 text-sm font-bold text-white flex items-center gap-1 ${categoryColors[experience.category]}`}>
              <Icon className="w-4 h-4" />
              {experience.category}
            </span>
            {experience.subcategory && (
              <span className="px-3 py-1 text-sm font-bold bg-muted border-2 border-foreground">
                {experience.subcategory}
              </span>
            )}
            {experience.is_ongoing && (
              <span className="px-3 py-1 text-sm font-bold bg-green-500 text-white">
                Ongoing
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            {experience.title}
          </h1>

          {experience.description && (
            <p className="text-xl font-sans max-w-3xl text-muted-foreground mb-6">
              {experience.description}
            </p>
          )}

          {dateRange && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span className="font-sans">{dateRange}</span>
            </div>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {experience.image_url && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <ComicPanel className="overflow-hidden">
              <img 
                src={experience.image_url} 
                alt={experience.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </ComicPanel>
          </div>
        </section>
      )}

      {/* Long Description */}
      {experience.long_description && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-display mb-6">About This Experience</h2>
              <div className="prose prose-lg max-w-none font-sans">
                <p className="whitespace-pre-wrap">{experience.long_description}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Skills & Tools */}
      {((experience.skills_used && experience.skills_used.length > 0) || 
        (experience.tools_used && experience.tools_used.length > 0)) && (
        <section className="py-16 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {experience.skills_used && experience.skills_used.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display text-pop-yellow mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Skills Applied
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {experience.skills_used.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-background text-foreground font-bold text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {experience.tools_used && experience.tools_used.length > 0 && (
                <div>
                  <h2 className="text-2xl font-display text-pop-cyan mb-4 flex items-center gap-2">
                    <Wrench className="w-6 h-6" />
                    Tools Used
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {experience.tools_used.map((tool) => (
                      <span key={tool} className="px-3 py-1 bg-background text-foreground font-bold text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Achievements */}
      {experience.key_achievements && experience.key_achievements.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display text-center mb-8 flex items-center justify-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              Key Achievements
            </h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {experience.key_achievements.map((achievement, i) => (
                <ComicPanel key={i} className="p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="font-sans">{achievement}</span>
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lessons Learned */}
      {experience.lessons_learned && experience.lessons_learned.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display text-center mb-8 flex items-center justify-center gap-3">
              <Lightbulb className="w-8 h-8 text-pop-yellow" />
              Lessons Learned
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {experience.lessons_learned.map((lesson, i) => (
                <ComicPanel key={i} className="p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-pop-yellow flex-shrink-0 mt-0.5" />
                  <span className="font-sans">{lesson}</span>
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Metrics */}
      {(experience.clients_served || experience.revenue_generated || experience.projects_completed) && (
        <section className="py-16 bg-pop-cyan">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display text-center mb-8 flex items-center justify-center gap-3">
              <TrendingUp className="w-8 h-8" />
              By The Numbers
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {experience.clients_served && (
                <ComicPanel className="p-6 text-center">
                  <div className="text-4xl font-display">{experience.clients_served}</div>
                  <div className="text-sm font-bold uppercase">Clients Served</div>
                </ComicPanel>
              )}
              {experience.revenue_generated && (
                <ComicPanel className="p-6 text-center">
                  <div className="text-4xl font-display">${experience.revenue_generated.toLocaleString()}</div>
                  <div className="text-sm font-bold uppercase">Revenue Generated</div>
                </ComicPanel>
              )}
              {experience.projects_completed && (
                <ComicPanel className="p-6 text-center">
                  <div className="text-4xl font-display">{experience.projects_completed}</div>
                  <div className="text-sm font-bold uppercase">Projects Completed</div>
                </ComicPanel>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Gallery */}
      {experience.screenshots && experience.screenshots.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display text-center mb-8">Gallery</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experience.screenshots.map((screenshot, i) => (
                <ComicPanel key={i} className="overflow-hidden">
                  <img 
                    src={screenshot} 
                    alt={`${experience.title} screenshot ${i + 1}`}
                    className="w-full h-auto"
                  />
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Link to="/experiences">
              <PopButton variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Experiences
              </PopButton>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ExperienceDetail;
