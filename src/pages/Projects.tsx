import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, LikeButton } from "@/components/pop-art";
import { ExternalLink, ArrowRight, Heart } from "lucide-react";

type ProjectStatus = "live" | "in_progress";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  url?: string;
  techStack: string[];
  fundingGoal?: number;
  fundingRaised?: number;
  likes: number;
}

const projectsData: Project[] = [
  {
    id: "1",
    title: "Notardex",
    slug: "notardex",
    description: "A virtual notebook platform with powerful features for organizing your thoughts, notes, and ideas. Built for thinkers and creators who need a flexible digital workspace.",
    status: "live",
    url: "https://notardex.com",
    techStack: ["React", "TypeScript", "Supabase", "Tailwind"],
    likes: 45,
  },
  {
    id: "2",
    title: "Solutiodex",
    slug: "solutiodex",
    description: "A community-driven search engine that provides social solutions from public posts and other public sources. Finding answers through collective wisdom.",
    status: "live",
    url: "https://solutiodex.com",
    techStack: ["React", "Node.js", "PostgreSQL", "AI/ML"],
    likes: 38,
  },
  {
    id: "3",
    title: "Zodaci",
    slug: "zodaci",
    description: "Birth chart and astrology site exploring cosmic connections. Discover your celestial blueprint and understand the stars' influence on your journey.",
    status: "live",
    url: "https://zodaci.com",
    techStack: ["React", "TypeScript", "Astrology APIs"],
    likes: 52,
  },
  {
    id: "4",
    title: "T1D Compass",
    slug: "t1d-compass",
    description: "A comprehensive Type 1 Diabetes management and community tool. Helping those with T1D navigate daily life, track health metrics, and connect with others on the same journey.",
    status: "in_progress",
    techStack: ["React Native", "TypeScript", "Supabase", "Health APIs"],
    fundingGoal: 5000,
    fundingRaised: 1250,
    likes: 67,
  },
  {
    id: "5",
    title: "Pulse Network",
    slug: "pulse-network",
    description: "A social change organizing platform designed to connect activists, community organizers, and change-makers. Amplifying voices and coordinating action for impact.",
    status: "in_progress",
    techStack: ["React", "GraphQL", "PostgreSQL", "Real-time"],
    fundingGoal: 7500,
    fundingRaised: 2100,
    likes: 41,
  },
  {
    id: "6",
    title: "UX Lens",
    slug: "ux-lens",
    description: "Product and service experience review case studies. Deep dives into what makes digital experiences work — and what doesn't. Building a library of UX insights.",
    status: "in_progress",
    techStack: ["React", "MDX", "Notion API"],
    fundingGoal: 3000,
    fundingRaised: 450,
    likes: 23,
  },
];

const Projects = () => {
  const [filter, setFilter] = useState<"all" | "live" | "in_progress">("all");
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const filteredProjects =
    filter === "all"
      ? projectsData
      : projectsData.filter((p) => p.status === filter);

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Tech Projects</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Projects Hub
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Building tools for change and innovation. From virtual notebooks to
            community platforms — technology that makes a difference.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Projects" },
              { id: "live", label: "Live" },
              { id: "in_progress", label: "In Progress" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => (
              <ComicPanel
                key={project.id}
                className={`p-6 flex flex-col animate-fade-in stagger-${(index % 5) + 1}`}
              >
                {/* Status Badge */}
                <div
                  className={`inline-block self-start px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground mb-4 ${
                    project.status === "live"
                      ? "bg-pop-cyan"
                      : "bg-pop-yellow"
                  }`}
                >
                  {project.status === "live" ? "Live" : "In Progress"}
                </div>

                <h3 className="text-2xl font-display mb-3">{project.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4 flex-grow">
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs font-bold bg-muted border border-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Funding Progress (for in-progress projects) */}
                {project.status === "in_progress" && project.fundingGoal && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>Funding Progress</span>
                      <span>
                        ${project.fundingRaised?.toLocaleString()} / $
                        {project.fundingGoal.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted border-2 border-foreground overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${
                            ((project.fundingRaised || 0) / project.fundingGoal) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-muted">
                  <LikeButton
                    count={project.likes + (likedItems.has(project.id) ? 1 : 0)}
                    liked={likedItems.has(project.id)}
                    onLike={() => toggleLike(project.id)}
                  />

                  {project.status === "live" && project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pop-link text-sm font-bold inline-flex items-center gap-1"
                    >
                      Visit Site <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      to="/support"
                      className="pop-link text-sm font-bold inline-flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4" /> Sponsor
                    </Link>
                  )}
                </div>
              </ComicPanel>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-pop-yellow mb-4">
            Want to Support These Projects?
          </h2>
          <p className="text-lg font-sans opacity-80 max-w-xl mx-auto mb-8">
            Your sponsorship helps bring these ideas to life and keeps the
            existing projects running and improving.
          </p>
          <Link to="/support">
            <PopButton variant="accent" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Become a Sponsor
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Projects;
