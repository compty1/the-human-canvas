import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import {
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Heart,
  GraduationCap,
  Loader2,
} from "lucide-react";

interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  progress_percent: number | null;
}

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  timeline: string;
  category: "project" | "skill" | "exploration";
}

// Hardcoded future plans (could be migrated to DB in future)
const futurePlans: FuturePlan[] = [
  {
    id: "1",
    title: "T1D Compass Mobile App",
    description: "Expand the T1D Compass platform into a full-featured mobile application with real-time health tracking.",
    timeline: "Q2 2025",
    category: "project",
  },
  {
    id: "2",
    title: "Philosophy Podcast",
    description: "Launch a podcast exploring philosophical concepts and their intersection with daily life and technology.",
    timeline: "Q3 2025",
    category: "exploration",
  },
  {
    id: "3",
    title: "Community Art Installation",
    description: "Create an interactive public art piece that reflects community stories and the human experience.",
    timeline: "Q4 2025",
    category: "project",
  },
  {
    id: "4",
    title: "Learn Rust Programming",
    description: "Master systems programming with Rust for building high-performance tools and applications.",
    timeline: "Ongoing",
    category: "skill",
  },
  {
    id: "5",
    title: "Documentary Project",
    description: "Document stories of transformation and resilience in Type 1 Diabetes communities.",
    timeline: "2026",
    category: "exploration",
  },
  {
    id: "6",
    title: "Open Source Contribution",
    description: "Build and contribute to open-source tools that empower creators and developers.",
    timeline: "Ongoing",
    category: "project",
  },
];

const categoryColors = {
  project: "bg-pop-cyan",
  skill: "bg-pop-magenta",
  exploration: "bg-pop-yellow",
};

const categoryIcons = {
  project: Target,
  skill: BookOpen,
  exploration: Lightbulb,
};

const FuturePlans = () => {
  // Fetch learning goals from database
  const { data: learningGoals = [], isLoading } = useQuery({
    queryKey: ["learning-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_goals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as LearningGoal[];
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">The Road Ahead</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Future Plans
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Where the journey is heading — upcoming projects, skills to master,
            and explorations on the horizon.
          </p>
        </div>
      </section>

      {/* Fund My Learning */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <GraduationCap className="w-10 h-10 text-pop-yellow" />
            <h2 className="text-4xl font-display text-pop-yellow">
              Fund My Learning
            </h2>
          </div>
          <p className="text-center text-lg opacity-80 max-w-2xl mx-auto mb-12">
            Help me grow by contributing to specific courses and certifications.
            Every dollar directly funds new skills that improve future projects.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pop-yellow" />
            </div>
          ) : learningGoals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg opacity-60">Learning goals coming soon...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {learningGoals.map((goal, index) => (
                <div
                  key={goal.id}
                  className={`p-6 border-4 border-background bg-foreground animate-fade-in stagger-${index + 1}`}
                >
                  <h3 className="text-xl font-display text-pop-cyan mb-2">
                    {goal.title}
                  </h3>
                  <p className="text-sm opacity-80 mb-4">{goal.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span>${goal.raised_amount || 0} raised</span>
                      <span>Goal: ${goal.target_amount || 0}</span>
                    </div>
                    <div className="h-4 bg-pop-black border-2 border-background overflow-hidden">
                      <div
                        className="h-full bg-pop-yellow transition-all"
                        style={{ width: `${goal.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <Link to="/support">
                    <button className="w-full py-2 font-bold uppercase tracking-wide border-2 border-background bg-pop-magenta text-background hover:bg-pop-cyan transition-colors">
                      <Heart className="w-4 h-4 inline mr-2" />
                      Contribute
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vision Board / Roadmap */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-center mb-4">
            Vision Board
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-12">
            Upcoming projects, skills to learn, and explorations planned for
            the future.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-bold">Project</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-bold">Skill</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              <span className="text-sm font-bold">Exploration</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futurePlans.map((plan, index) => {
              const Icon = categoryIcons[plan.category];
              return (
                <ComicPanel
                  key={plan.id}
                  className={`p-6 animate-fade-in stagger-${(index % 5) + 1}`}
                >
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground mb-4 ${
                      categoryColors[plan.category]
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {plan.category}
                  </div>

                  <h3 className="text-xl font-display mb-2">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{plan.timeline}</span>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-pop-cyan">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-foreground mb-6">
            Want to Make These Plans a Reality?
          </h2>
          <p className="text-lg font-sans text-foreground/80 max-w-xl mx-auto mb-8">
            Your support directly funds learning goals, project development, and
            the continuous exploration of what makes us human.
          </p>
          <Link to="/support">
            <PopButton variant="primary" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Support the Journey
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default FuturePlans;
