import { Link } from "react-router-dom";
import { ArrowRight, Palette, Code, PenTool, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, Ticker, HalftoneImage } from "@/components/pop-art";

import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";

const currentProjects = [
  "T1D Compass - Building",
  "Pulse Network - Designing",
  "UX Lens - Researching",
  "New Art Series - Creating",
];

const navPanels = [
  {
    title: "Art",
    description: "Visual explorations of the human experience",
    href: "/art",
    icon: Palette,
    color: "magenta" as const,
  },
  {
    title: "Projects",
    description: "Tech tools for change and innovation",
    href: "/projects",
    icon: Code,
    color: "cyan" as const,
  },
  {
    title: "Writing",
    description: "Stories, essays, and cultural commentary",
    href: "/writing",
    icon: PenTool,
    color: "yellow" as const,
  },
  {
    title: "Support",
    description: "Fund the journey and future projects",
    href: "/support",
    icon: Heart,
    color: "magenta" as const,
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center benday-dots overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="space-y-8 animate-fade-in">
              <div className="caption-box inline-block">The Human Experience</div>
              <h1 className="text-6xl md:text-8xl font-display leading-none gradient-text">
                LeCompte
              </h1>
              <p className="text-xl md:text-2xl font-sans max-w-lg">
                Artist. Developer. Storyteller. Building tools and creating works
                that reflect society and spark transformation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/projects">
                  <PopButton variant="primary" size="lg">
                    View Projects <ArrowRight className="ml-2 w-5 h-5" />
                  </PopButton>
                </Link>
                <Link to="/art">
                  <PopButton variant="secondary" size="lg">
                    Explore Art
                  </PopButton>
                </Link>
              </div>
            </div>

            {/* Right - Art Preview */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <HalftoneImage
                    src={moodboard1}
                    alt="Moodboard artwork"
                    frameColor="magenta"
                    className="animate-fade-in stagger-1"
                  />
                  <HalftoneImage
                    src={nancySinatra}
                    alt="Nancy Sinatra portrait"
                    frameColor="yellow"
                    className="animate-fade-in stagger-3"
                  />
                </div>
                <div className="pt-12">
                  <HalftoneImage
                    src={moodboard2}
                    alt="Moodboard artwork 2"
                    frameColor="cyan"
                    className="animate-fade-in stagger-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Currently Working On Ticker */}
      <Ticker items={currentProjects} />

      {/* Navigation Panels */}
      <section className="py-20 screen-print">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display text-center mb-12">
            Explore the Work
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navPanels.map((panel, index) => (
              <Link key={panel.href} to={panel.href}>
                <ComicPanel
                  color={panel.color}
                  className={`p-6 h-full animate-fade-in stagger-${index + 1}`}
                >
                  <panel.icon className="w-12 h-12 mb-4 text-foreground" />
                  <h3 className="text-2xl font-display mb-2">{panel.title}</h3>
                  <p className="text-sm font-sans opacity-80">
                    {panel.description}
                  </p>
                  <ArrowRight className="w-5 h-5 mt-4" />
                </ComicPanel>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display text-pop-yellow mb-8">
              The Human Experience Is Everything
            </h2>
            <p className="text-xl md:text-2xl font-sans leading-relaxed opacity-90">
              From Type 1 Diabetes tools to philosophical essays, from pop art
              portraits to community-driven search engines — every project explores
              what it means to be human, to struggle, to transform, and to connect.
            </p>
            <div className="mt-12">
              <Link to="/about">
                <PopButton variant="accent" size="lg">
                  Learn More About Me
                </PopButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display">Live Projects</h2>
            <Link to="/projects" className="pop-link text-lg font-bold">
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Notardex",
                description: "Virtual notebook platform with powerful features for organizing your thoughts",
                url: "https://notardex.com",
              },
              {
                title: "Solutiodex",
                description: "Community-driven search engine providing social solutions from public sources",
                url: "https://solutiodex.com",
              },
              {
                title: "Zodaci",
                description: "Birth chart and astrology site exploring cosmic connections",
                url: "https://zodaci.com",
              },
            ].map((project, index) => (
              <ComicPanel
                key={project.title}
                className={`p-6 animate-fade-in stagger-${index + 1}`}
              >
                <h3 className="text-2xl font-display mb-3">{project.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4">
                  {project.description}
                </p>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pop-link text-sm font-bold inline-flex items-center gap-1"
                >
                  Visit Site <ArrowRight className="w-4 h-4" />
                </a>
              </ComicPanel>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-pop-cyan">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">
            Support the Journey
          </h2>
          <p className="text-lg font-sans text-foreground/80 max-w-2xl mx-auto mb-8">
            Every contribution helps fund new projects, learning goals, and the
            continuous exploration of what makes us human.
          </p>
          <Link to="/support">
            <PopButton variant="primary" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Donate or Sponsor
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
