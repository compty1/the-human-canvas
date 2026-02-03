import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Palette, Code, PenTool, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, Ticker, HalftoneImage } from "@/components/pop-art";
import { HeroBackground } from "@/components/home/HeroBackground";
import { ArtStrip, DecorativeArt } from "@/components/home/DecorativeArt";
import { supabase } from "@/integrations/supabase/client";

import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";
import flowerPotHead from "@/assets/artwork/hero/flower-pot-head.png";
import bandageFace from "@/assets/artwork/hero/bandage-face.png";

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
  // Fetch ticker items from site_content
  const { data: tickerContent } = useQuery({
    queryKey: ["site-content-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "ticker_items")
        .single();
      if (error) return null;
      return data?.content_value;
    },
  });

  // Fetch featured project IDs from site_content
  const { data: featuredProjectIds } = useQuery({
    queryKey: ["site-content-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "featured_project_ids")
        .single();
      if (error) return null;
      try {
        return JSON.parse(data?.content_value || "[]");
      } catch {
        return [];
      }
    },
  });

  // Fetch featured projects from database
  const { data: featuredProjects } = useQuery({
    queryKey: ["featured-projects", featuredProjectIds],
    queryFn: async () => {
      if (!featuredProjectIds || featuredProjectIds.length === 0) {
        // Fallback to live projects
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, description, slug, external_url")
          .eq("status", "live")
          .limit(3);
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, slug, external_url")
        .in("id", featuredProjectIds);
      if (error) throw error;
      return data;
    },
    enabled: featuredProjectIds !== undefined,
  });

  // Parse ticker items - try JSON first, then comma-separated
  const tickerItems = (() => {
    if (!tickerContent) {
      return ["T1D Compass - Building", "Pulse Network - Designing", "UX Lens - Researching", "New Art Series - Creating"];
    }
    try {
      const parsed = JSON.parse(tickerContent);
      return Array.isArray(parsed) ? parsed : [tickerContent];
    } catch {
      return tickerContent.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  })();

  return (
    <Layout>
      {/* Hero Section with stunning background */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Artwork background */}
        <HeroBackground />
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/70" />
        
        {/* Ben-Day dots pattern */}
        <div className="absolute inset-0 benday-dots opacity-50" />

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

            {/* Right - Art Preview with new artwork */}
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
                    src={flowerPotHead}
                    alt="Flower Pot Head artwork"
                    frameColor="yellow"
                    className="animate-fade-in stagger-3"
                  />
                </div>
                <div className="pt-12 space-y-6">
                  <HalftoneImage
                    src={bandageFace}
                    alt="Bandage Face artwork"
                    frameColor="cyan"
                    className="animate-fade-in stagger-2"
                  />
                  <HalftoneImage
                    src={nancySinatra}
                    alt="Nancy Sinatra portrait"
                    frameColor="magenta"
                    className="animate-fade-in stagger-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Currently Working On Ticker */}
      <Ticker items={tickerItems} />

      {/* Art Strip Divider */}
      <ArtStrip />

      {/* Navigation Panels */}
      <section className="py-20 screen-print relative overflow-hidden">
        {/* Decorative artwork */}
        <DecorativeArt variant="left" className="absolute -left-16 top-20" />
        <DecorativeArt variant="right" className="absolute -right-16 bottom-20" />
        
        <div className="container mx-auto px-4 relative z-10">
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
      <section className="py-20 bg-foreground text-background relative overflow-hidden">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--background)) 2px, transparent 2px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
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
      <section className="py-20 relative overflow-hidden">
        {/* Floating decorative art */}
        <DecorativeArt variant="floating" className="absolute left-10 top-40" />
        <DecorativeArt variant="corner" className="absolute right-5 bottom-10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display">Live Projects</h2>
            <Link to="/projects" className="pop-link text-lg font-bold">
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(featuredProjects || []).map((project, index) => (
              <ComicPanel
                key={project.id}
                className={`p-6 animate-fade-in stagger-${index + 1}`}
              >
                <h3 className="text-2xl font-display mb-3">{project.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4">
                  {project.description}
                </p>
                {project.external_url ? (
                  <a
                    href={project.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pop-link text-sm font-bold inline-flex items-center gap-1"
                  >
                    Visit Site <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    to={`/projects/${project.slug}`}
                    className="pop-link text-sm font-bold inline-flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </ComicPanel>
            ))}
          </div>
        </div>
      </section>

      {/* Art Strip before CTA */}
      <ArtStrip />

      {/* CTA Section */}
      <section className="py-20 bg-pop-cyan relative overflow-hidden">
        {/* Decorative pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--foreground)) 0, hsl(var(--foreground)) 1px, transparent 0, transparent 50%)`,
            backgroundSize: '10px 10px',
          }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
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
