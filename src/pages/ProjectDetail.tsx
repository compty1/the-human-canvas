import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, LikeButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, ArrowLeft, Heart, Check, Target, Lightbulb, Calendar, DollarSign, Users, Layers, Accessibility } from "lucide-react";
import { useState } from "react";

interface ExpenseItem {
  category: string;
  description: string;
  amount: number;
  date?: string;
}

interface IncomeData {
  revenue?: number;
  user_count?: number;
  sources?: string[];
}

// Helper to format date range
const formatDateRange = (startDate?: string | null, endDate?: string | null, status?: string) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  if (status === "in_progress") {
    return `Started ${startStr}`;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    const endStr = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }
  
  return startStr;
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
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

  if (error || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">The project you're looking for doesn't exist.</p>
          <Link to="/projects">
            <PopButton>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
            </PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  // Parse financial data
  const expenses = (project.expenses as unknown as ExpenseItem[]) || [];
  const incomeData = (project.income_data as unknown as IncomeData) || {};
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const hasFinancialData = expenses.length > 0 || incomeData.revenue || incomeData.user_count;
  
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Technical notes
  const architectureNotes = (project as Record<string, unknown>).architecture_notes as string | null;
  const accessibilityNotes = (project as Record<string, unknown>).accessibility_notes as string | null;
  const hasTechnicalNotes = architectureNotes || accessibilityNotes;

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <div className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground ${
              project.status === "live" ? "bg-pop-teal text-background" : project.status === "in_progress" ? "bg-pop-gold" : "bg-muted"
            }`}>
              {project.status === "live" ? "Live" : project.status === "in_progress" ? "In Progress" : "Planned"}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            {project.logo_url && (
              <div className="w-16 h-16 bg-background border-4 border-foreground p-2 flex items-center justify-center flex-shrink-0">
                <img 
                  src={project.logo_url} 
                  alt={`${project.title} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <h1 className="text-5xl md:text-7xl font-display gradient-text">
              {project.title}
            </h1>
          </div>
          
          <p className="text-xl font-sans max-w-3xl text-muted-foreground mb-8">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-4">
            {project.external_url && (
              <a href={project.external_url} target="_blank" rel="noopener noreferrer">
                <PopButton variant="primary" size="lg">
                  <ExternalLink className="w-5 h-5 mr-2" /> Visit Live Site
                </PopButton>
              </a>
            )}
            <Link to="/support">
              <PopButton variant="secondary" size="lg">
                <Heart className="w-5 h-5 mr-2" /> Sponsor This Project
              </PopButton>
            </Link>
          </div>

          {/* Project Timeline */}
          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4">
              <Calendar className="w-5 h-5" />
              <span className="font-sans">
                {formatDateRange(project.start_date, project.end_date, project.status)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {project.image_url && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <ComicPanel className="overflow-hidden">
              <img 
                src={project.image_url} 
                alt={project.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </ComicPanel>
          </div>
        </section>
      )}

      {/* Problem & Solution */}
      {(project.problem_statement || project.solution_summary) && (
        <section className="py-16 screen-print">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {project.problem_statement && (
                <ComicPanel className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-pop-terracotta" />
                    <h2 className="text-2xl font-display">The Problem</h2>
                  </div>
                  <p className="text-lg font-sans text-muted-foreground">
                    {project.problem_statement}
                  </p>
                </ComicPanel>
              )}
              
              {project.solution_summary && (
                <ComicPanel className="p-8 bg-pop-teal text-background">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-8 h-8" />
                    <h2 className="text-2xl font-display">The Solution</h2>
                  </div>
                  <p className="text-lg font-sans">
                    {project.solution_summary}
                  </p>
                </ComicPanel>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Financial Transparency */}
      {hasFinancialData && (
        <section className="py-16 bg-pop-gold/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <DollarSign className="w-8 h-8" />
                <h2 className="text-4xl font-display">Project Investment</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Expenses Breakdown */}
                {expenses.length > 0 && (
                  <ComicPanel className="p-6">
                    <h3 className="text-xl font-display mb-4">Investment Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(expensesByCategory).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="font-sans">{category}</span>
                          <span className="font-bold">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t-2 border-foreground pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total Invested</span>
                          <span className="font-bold text-xl">${totalExpenses.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </ComicPanel>
                )}

                {/* Income & Metrics */}
                {(incomeData.revenue || incomeData.user_count) && (
                  <ComicPanel className="p-6 bg-pop-teal text-background">
                    <h3 className="text-xl font-display mb-4">Results & Metrics</h3>
                    <div className="space-y-4">
                      {incomeData.revenue && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-6 h-6" />
                          <div>
                            <div className="text-sm opacity-80">Revenue Generated</div>
                            <div className="text-2xl font-bold">${incomeData.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                      {incomeData.user_count && (
                        <div className="flex items-center gap-3">
                          <Users className="w-6 h-6" />
                          <div>
                            <div className="text-sm opacity-80">Active Users</div>
                            <div className="text-2xl font-bold">{incomeData.user_count.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                      {incomeData.sources && incomeData.sources.length > 0 && (
                        <div className="pt-3 border-t border-background/30">
                          <div className="text-sm opacity-80 mb-2">Revenue Sources</div>
                          <div className="flex flex-wrap gap-2">
                            {incomeData.sources.map((source) => (
                              <span key={source} className="px-2 py-1 bg-background/20 text-sm font-bold">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ComicPanel>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {project.features && project.features.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {project.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-background border-2 border-foreground">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-sans">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Gallery */}
      {project.screenshots && project.screenshots.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-display text-center mb-12">Screenshots</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {project.screenshots.map((screenshot, index) => (
                <ComicPanel key={index} className="overflow-hidden">
                  <img 
                    src={screenshot} 
                    alt={`${project.title} screenshot ${index + 1}`}
                    className="w-full h-auto"
                  />
                </ComicPanel>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <section className="py-16 bg-foreground text-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-display text-pop-gold mb-8">Tech Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {project.tech_stack.map((tech) => (
                <span 
                  key={tech}
                  className="px-4 py-2 bg-background text-foreground font-bold uppercase text-sm border-2 border-background"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Notes */}
      {hasTechnicalNotes && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-display text-center mb-12">Technical Details</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {architectureNotes && (
                  <ComicPanel className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Layers className="w-6 h-6 text-pop-teal" />
                      <h3 className="text-xl font-display">Architecture</h3>
                    </div>
                    <p className="font-sans text-muted-foreground whitespace-pre-wrap">
                      {architectureNotes}
                    </p>
                  </ComicPanel>
                )}
                
                {accessibilityNotes && (
                  <ComicPanel className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Accessibility className="w-6 h-6 text-pop-terracotta" />
                      <h3 className="text-xl font-display">Accessibility</h3>
                    </div>
                    <p className="font-sans text-muted-foreground whitespace-pre-wrap">
                      {accessibilityNotes}
                    </p>
                  </ComicPanel>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Long Description / Case Study */}
      {(project.long_description || project.case_study) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {project.long_description && (
                <>
                  <h2 className="text-4xl font-display mb-8">About This Project</h2>
                  <div className="prose prose-lg max-w-none font-sans">
                    <p>{project.long_description}</p>
                  </div>
                </>
              )}
              
              {project.case_study && (
                <div className="mt-12">
                  <h2 className="text-4xl font-display mb-8">Case Study</h2>
                  <div 
                    className="prose prose-lg max-w-none font-sans"
                    dangerouslySetInnerHTML={{ __html: project.case_study }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Funding Progress (for in-progress projects) */}
      {project.status === "in_progress" && project.funding_goal && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-3xl font-display mb-6">Help Bring This to Life</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span>Funding Progress</span>
                  <span>
                    ${(project.funding_raised || 0).toLocaleString()} / ${project.funding_goal.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 bg-background border-2 border-foreground overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((project.funding_raised || 0) / project.funding_goal) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Link to="/support">
                <PopButton variant="accent" size="lg">
                  <Heart className="w-5 h-5 mr-2" /> Contribute to This Project
                </PopButton>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Actions Footer */}
      <section className="py-12 border-t-4 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LikeButton
              count={likeCount}
              liked={liked}
              onLike={toggleLike}
            />
            <div className="flex gap-4">
              {project.external_url && (
                <a href={project.external_url} target="_blank" rel="noopener noreferrer">
                  <PopButton variant="primary">
                    <ExternalLink className="w-4 h-4 mr-2" /> Visit Site
                  </PopButton>
                </a>
              )}
              <Link to="/projects">
                <PopButton variant="secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" /> All Projects
                </PopButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProjectDetail;
