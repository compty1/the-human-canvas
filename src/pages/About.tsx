import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, SpeechBubble, HalftoneImage } from "@/components/pop-art";
import { Mail, ExternalLink, Heart, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";

import zacPortrait from "@/assets/artwork/zac-portrait.png";

const ABOUT_KEYS = [
  "profile_image", "bio_intro", "bio_full", "about_services",
  "about_interests", "speech_bubble_quote", "about_location",
  "experience_years", "contact_email",
];

const About = () => {
  const { data: aboutContent } = useQuery({
    queryKey: ["about-page-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", ABOUT_KEYS);
      if (error) return {};
      return (data || []).reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch live projects from DB
  const { data: liveProjects } = useQuery({
    queryKey: ["about-live-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, external_url, slug")
        .eq("status", "live")
        .limit(6);
      if (error) return [];
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const profileImage = aboutContent?.profile_image || zacPortrait;
  const bioIntro = aboutContent?.bio_intro || "Artist. Developer. Writer. Type 1 Diabetic. Exploring what it means to be human through every medium I can get my hands on.";
  const bioFull = aboutContent?.bio_full || "";
  const contactEmail = aboutContent?.contact_email || "hello@lecompte.art";
  const location = aboutContent?.about_location || "";
  const experienceYears = aboutContent?.experience_years || "";

  let services: string[] = [];
  try {
    services = aboutContent?.about_services ? JSON.parse(aboutContent.about_services) : [];
  } catch { /* use default */ }
  if (services.length === 0) {
    services = [
      "Web Development & UX Design",
      "Content Writing & Journalism",
      "Custom Illustration & Portraits",
      "UX Research & Analysis",
      "Brand Identity Development",
    ];
  }

  const speechQuote = aboutContent?.speech_bubble_quote || "\"I build tools that allow for change and different ways of innovative operation. I'm passionate about complex, interconnected ecosystems that reflect society and what makes us human.\"";

  let interests: string[] = [];
  try {
    interests = aboutContent?.about_interests ? JSON.parse(aboutContent.about_interests) : [];
  } catch { /* use default */ }
  if (interests.length === 0) {
    interests = [
      "Type 1 Diabetes",
      "Art & Cultural Influence",
      "Philosophy & Metaphysics",
      "Narrative Storytelling",
      "Technology for Change",
      "Personal Transformation",
      "Building Furniture",
    ];
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="caption-box inline-block mb-4">About</div>
              <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
                The Human Behind the Work
              </h1>
              <p className="text-xl font-sans text-muted-foreground">
                {bioIntro}
              </p>
            </div>
            <div className="flex justify-center">
              <HalftoneImage
                src={profileImage}
                alt="LeCompte portrait"
                frameColor="magenta"
                className="max-w-sm animate-fade-in"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-display mb-8">My Story</h2>

            {bioFull ? (
              <div
                className="space-y-6 text-lg font-sans leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(bioFull) }}
              />
            ) : (
              <div className="space-y-6 text-lg font-sans leading-relaxed">
                <p>
                  The human experience is everything to me. From the moment I was
                  diagnosed with Type 1 Diabetes, I understood that life is about
                  transformation — about taking the challenges we're given and
                  finding meaning, beauty, and purpose within them.
                </p>
                <p>
                  I create across disciplines because no single medium can capture
                  everything I want to explore. Through <strong>visual art</strong>,
                  I examine identity, culture, and emotion. Through{" "}
                  <strong>technology</strong>, I build tools that empower people to
                  connect, learn, and change. Through <strong>writing</strong>, I
                  dive deep into philosophy, narrative, and the patterns that shape
                  our world.
                </p>
                <p>
                  My work is informed by my passions: the T1D community, the power
                  of art to influence culture, philosophical inquiry, narrative
                  storytelling, technology for social change, historical patterns,
                  and the profound journeys of personal transformation we all
                  undergo.
                </p>
              </div>
            )}

            <SpeechBubble className="my-8">
              <p className="text-xl font-display">{speechQuote}</p>
            </SpeechBubble>

            {!bioFull && (
              <p className="text-lg font-sans leading-relaxed">
                Whether it's <strong>Notardex</strong> helping people organize
                their thoughts, <strong>Solutiodex</strong> connecting communities
                to solutions, or <strong>Zodaci</strong> exploring cosmic
                connections — every project is an exploration of the human
                experience.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Areas of Interest */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-12">
            What Drives Me
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {interests.map((interest) => {
              const title = typeof interest === "string" ? interest : (interest as any).title || interest;
              const description = typeof interest === "object" ? (interest as any).description : "";
              return (
                <div key={title} className="p-6 border-2 border-background">
                  <h3 className="text-xl font-display text-pop-cyan mb-2">{title}</h3>
                  {description && <p className="text-sm opacity-80">{description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-display text-center mb-4">
              Work With Me
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              I'm available for collaborations, commissioned work, and consulting
              in web development, UX design, content creation, and visual art.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <ComicPanel className="p-6">
                <h3 className="text-2xl font-display mb-4">Services</h3>
                <ul className="space-y-3">
                  {services.map((service) => (
                    <li key={service} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary" />
                      <span className="font-sans">{service}</span>
                    </li>
                  ))}
                </ul>
              </ComicPanel>

              <ComicPanel className="p-6 bg-pop-cyan">
                <h3 className="text-2xl font-display mb-4">Get in Touch</h3>
                <p className="font-sans mb-6">
                  Have a project in mind? Let's create something meaningful
                  together.
                </p>
                <div className="space-y-3">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="flex items-center gap-2 font-bold hover:underline"
                  >
                    <Mail className="w-5 h-5" /> {contactEmail}
                  </a>
                  {location && (
                    <p className="text-sm text-muted-foreground mt-2">📍 {location}</p>
                  )}
                  {experienceYears && (
                    <p className="text-sm text-muted-foreground">🎯 {experienceYears} years of experience</p>
                  )}
                </div>
              </ComicPanel>
            </div>

            {/* Media Kit */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Need a professional overview?
              </p>
              <PopButton variant="primary">
                <Download className="w-4 h-4 mr-2" /> Download Media Kit (Coming
                Soon)
              </PopButton>
            </div>
          </div>
        </div>
      </section>

      {/* Live Projects */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-center mb-12">
            My Live Projects
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(liveProjects && liveProjects.length > 0 ? liveProjects : [
              { id: "1", title: "Notardex", external_url: "https://notardex.com", description: "Virtual notebook platform", slug: "" },
              { id: "2", title: "Solutiodex", external_url: "https://solutiodex.com", description: "Community-driven solutions", slug: "" },
              { id: "3", title: "Zodaci", external_url: "https://zodaci.com", description: "Birth charts & astrology", slug: "" },
            ]).map((project) => (
              <a key={project.id} href={project.external_url || `/projects/${project.slug}`} target={project.external_url ? "_blank" : undefined} rel={project.external_url ? "noopener noreferrer" : undefined}>
                <ComicPanel className="p-6 h-full">
                  <h3 className="text-xl font-display mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                    Visit <ExternalLink className="w-4 h-4" />
                  </span>
                </ComicPanel>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-pop-magenta">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-background mb-6">
            Support the Journey
          </h2>
          <p className="text-lg text-background/80 max-w-xl mx-auto mb-8">
            Every contribution helps fund new projects, learning, and the
            continuous exploration of what makes us human.
          </p>
          <Link to="/support">
            <PopButton variant="accent" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Support My Work
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default About;
