import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Palette, Code, PenTool, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, Ticker, HalftoneImage, PolaroidFrame } from "@/components/pop-art";
import { HeroBackground } from "@/components/home/HeroBackground";
import { ArtStrip, DecorativeArt, PolaroidStrip } from "@/components/home/DecorativeArt";
import { FilmStrip } from "@/components/home/FilmStrip";
import { TexturedSection } from "@/components/layout/TexturedSection";
import { supabase } from "@/integrations/supabase/client";

import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";
import flowerPotHead from "@/assets/artwork/hero/flower-pot-head.png";
import bandageFace from "@/assets/artwork/hero/bandage-face.png";
import anarchistKing from "@/assets/artwork/hero/anarchist-king.png";
import peaceLoveCollage from "@/assets/artwork/hero/peace-love-collage.png";

const navPanels = [
  { title: "Art", description: "Visual explorations of the human experience", href: "/art", icon: Palette, color: "terracotta" as const },
  { title: "Projects", description: "Tech tools for change and innovation", href: "/projects", icon: Code, color: "teal" as const },
  { title: "Writing", description: "Stories, essays, and cultural commentary", href: "/writing", icon: PenTool, color: "gold" as const },
  { title: "Support", description: "Fund the journey and future projects", href: "/support", icon: Heart, color: "terracotta" as const },
];

const filmStripImages = [
  { src: moodboard1, alt: "Moodboard 1" },
  { src: flowerPotHead, alt: "Flower Pot Head" },
  { src: nancySinatra, alt: "Nancy Sinatra" },
  { src: bandageFace, alt: "Bandage Face" },
  { src: moodboard2, alt: "Moodboard 2" },
  { src: anarchistKing, alt: "Anarchist King" },
  { src: peaceLoveCollage, alt: "Peace Love Collage" },
];

interface HomepageSection {
  id: string;
  label: string;
  visible: boolean;
}

const Index = () => {
  // Fetch homepage section config
  const { data: sectionConfig } = useQuery({
    queryKey: ["site-content-homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "homepage_sections")
        .maybeSingle();
      if (error || !data) return null;
      try {
        return JSON.parse(data?.content_value || "null") as HomepageSection[];
      } catch { return null; }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch hero and mission content from admin
  const { data: heroContent } = useQuery({
    queryKey: ["site-content-hero-mission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", ["hero_title", "hero_subtitle", "hero_description", "mission_statement"]);
      if (error) return {};
      return (data || []).reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);
    },
    staleTime: 5 * 60 * 1000,
  });

  const heroTitle = heroContent?.hero_title || "LeCompte";
  const heroSubtitle = heroContent?.hero_subtitle || "The Human Experience";
  const heroDescription = heroContent?.hero_description || "Artist. Developer. Storyteller. Building tools and creating works that reflect society and spark transformation.";
  const missionStatement = heroContent?.mission_statement || "From Type 1 Diabetes tools to philosophical essays, from pop art portraits to community-driven search engines — every project explores what it means to be human, to struggle, to transform, and to connect.";

  // Fetch ticker items from site_content
  const { data: tickerContent } = useQuery({
    queryKey: ["site-content-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("content_value").eq("section_key", "ticker_items").maybeSingle();
      if (error || !data) return null;
      return data?.content_value;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured project IDs from site_content
  const { data: featuredProjectIds } = useQuery({
    queryKey: ["site-content-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("content_value").eq("section_key", "featured_project_ids").maybeSingle();
      if (error || !data) return null;
      try { return JSON.parse(data?.content_value || "[]"); } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured projects from database
  const { data: featuredProjects } = useQuery({
    queryKey: ["featured-projects", featuredProjectIds],
    queryFn: async () => {
      if (!featuredProjectIds || featuredProjectIds.length === 0) {
        const { data, error } = await supabase.from("projects").select("id, title, description, slug, external_url").eq("status", "live").limit(3);
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("projects").select("id, title, description, slug, external_url").in("id", featuredProjectIds);
      if (error) throw error;
      return data;
    },
    enabled: featuredProjectIds !== undefined,
  });

  const tickerItems = (() => {
    if (!tickerContent) return ["T1D Compass - Building", "Pulse Network - Designing", "UX Lens - Researching", "New Art Series - Creating"];
    try {
      const parsed = JSON.parse(tickerContent);
      return Array.isArray(parsed) ? parsed : [tickerContent];
    } catch { return tickerContent.split(",").map((s: string) => s.trim()).filter(Boolean); }
  })();

  // Check if a section is visible
  const isSectionVisible = (id: string) => {
    if (!sectionConfig) return true; // all visible by default
    const section = sectionConfig.find(s => s.id === id);
    return section ? section.visible : true;
  };

  // Get sections in order
  const orderedSectionIds = sectionConfig
    ? sectionConfig.filter(s => s.visible).map(s => s.id)
    : ["hero", "ticker", "film-strip", "nav-panels", "mission", "polaroid-strip", "featured-projects", "art-strip", "cta"];

  // Section components map
  const sectionComponents: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="relative min-h-[90vh] flex items-center overflow-hidden">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/75 to-background/60" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-block px-4 py-2 bg-pop-terracotta text-pop-cream font-bold uppercase tracking-wide border-2 border-foreground">
                {heroSubtitle}
              </div>
              <h1 className="text-6xl md:text-8xl font-display leading-none gradient-text">{heroTitle}</h1>
              <p className="text-xl md:text-2xl font-sans max-w-lg text-foreground/90">
                {heroDescription}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/projects"><PopButton variant="primary" size="lg">View Projects <ArrowRight className="ml-2 w-5 h-5" /></PopButton></Link>
                <Link to="/art"><PopButton variant="secondary" size="lg">Explore Art</PopButton></Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative h-[500px]">
                <PolaroidFrame src={anarchistKing} alt="Anarchist King" title="Anarchist King" rotation={-8} size="lg" className="absolute top-0 left-0 animate-fade-in stagger-1" />
                <PolaroidFrame src={bandageFace} alt="Bandage Face" title="Bandage Face" rotation={5} size="md" className="absolute top-10 right-10 animate-fade-in stagger-2" />
                <PolaroidFrame src={flowerPotHead} alt="Flower Pot Head" title="Bloom" rotation={-3} size="md" className="absolute bottom-20 left-20 animate-fade-in stagger-3" />
                <PolaroidFrame src={peaceLoveCollage} alt="Peace Love" rotation={7} size="sm" className="absolute bottom-0 right-0 animate-fade-in stagger-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    ),
    ticker: <Ticker key="ticker" items={tickerItems} />,
    "film-strip": <FilmStrip key="film-strip" images={filmStripImages} speed="slow" />,
    "nav-panels": (
      <TexturedSection key="nav-panels" variant="warm" texture="paper" className="py-20">
        <DecorativeArt variant="left" className="absolute -left-16 top-20" />
        <DecorativeArt variant="right" className="absolute -right-16 bottom-20" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-display text-center mb-12">Explore the Work</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navPanels.map((panel, index) => {
              const colorClasses = {
                terracotta: "bg-pop-terracotta/10 hover:bg-pop-terracotta/20 border-pop-terracotta",
                teal: "bg-pop-teal/10 hover:bg-pop-teal/20 border-pop-teal",
                gold: "bg-pop-gold/10 hover:bg-pop-gold/20 border-pop-gold",
              };
              return (
                <Link key={panel.href} to={panel.href}>
                  <div className={`p-6 h-full border-2 ${colorClasses[panel.color]} transition-all duration-300 hover:translate-x-1 hover:translate-y-1 animate-fade-in stagger-${index + 1}`} style={{ boxShadow: '4px 4px 0 0 hsl(var(--foreground))' }}>
                    <panel.icon className="w-12 h-12 mb-4 text-foreground" />
                    <h3 className="text-2xl font-display mb-2">{panel.title}</h3>
                    <p className="text-sm font-sans text-muted-foreground">{panel.description}</p>
                    <ArrowRight className="w-5 h-5 mt-4 text-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </TexturedSection>
    ),
    mission: (
      <TexturedSection key="mission" variant="dark" texture="dots" className="py-20">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle, hsl(var(--pop-gold)) 2px, transparent 2px)`, backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-display text-pop-gold mb-8">The Human Experience Is Everything</h2>
            <p className="text-xl md:text-2xl font-sans leading-relaxed opacity-90">
              {missionStatement}
            </p>
            <div className="mt-12">
              <Link to="/about"><PopButton variant="accent" size="lg">Learn More About Me</PopButton></Link>
            </div>
          </div>
        </div>
      </TexturedSection>
    ),
    "polaroid-strip": <PolaroidStrip key="polaroid-strip" />,
    "featured-projects": (
      <TexturedSection key="featured-projects" variant="cream" texture="lines" className="py-20">
        <DecorativeArt variant="floating" className="absolute left-10 top-40" />
        <DecorativeArt variant="corner" className="absolute right-5 bottom-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display">Live Projects</h2>
            <Link to="/projects" className="pop-link text-lg font-bold">View All</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {(featuredProjects || []).map((project, index) => (
              <ComicPanel key={project.id} className={`p-6 animate-fade-in stagger-${index + 1}`}>
                <h3 className="text-2xl font-display mb-3">{project.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4">{project.description}</p>
                {project.external_url ? (
                  <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="pop-link text-sm font-bold inline-flex items-center gap-1">
                    Visit Site <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link to={`/projects/${project.slug}`} className="pop-link text-sm font-bold inline-flex items-center gap-1">
                    View Details <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </ComicPanel>
            ))}
          </div>
        </div>
      </TexturedSection>
    ),
    "art-strip": <ArtStrip key="art-strip" />,
    cta: (
      <TexturedSection key="cta" variant="teal" texture="none" className="py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--pop-cream)) 0, hsl(var(--pop-cream)) 1px, transparent 0, transparent 50%)`, backgroundSize: '10px 10px' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display text-pop-cream mb-6">Support the Journey</h2>
          <p className="text-lg font-sans text-pop-cream/80 max-w-2xl mx-auto mb-8">
            Every contribution helps fund new projects, learning goals, and the continuous exploration of what makes us human.
          </p>
          <Link to="/support"><PopButton variant="primary" size="lg"><Heart className="w-5 h-5 mr-2" /> Donate or Sponsor</PopButton></Link>
        </div>
      </TexturedSection>
    ),
  };

  return (
    <Layout>
      {orderedSectionIds.map(id => sectionComponents[id] || null)}
    </Layout>
  );
};

export default Index;
