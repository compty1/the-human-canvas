import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";



export const Footer = forwardRef<HTMLElement>((_, ref) => {
  const { data: siteContent } = useQuery({
    queryKey: ["site-content-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", [
          "site_tagline",
          "footer_text",
          "social_twitter",
          "social_instagram",
          "social_github",
          "social_linkedin",
        ]);
      if (error) return {};
      return (data || []).reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch live projects for footer
  const { data: liveProjects } = useQuery({
    queryKey: ["footer-live-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, external_url, slug")
        .eq("status", "live")
        .limit(5);
      if (error) return [];
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tagline = siteContent?.site_tagline || "Exploring the human experience through art, technology, and words.";
  const footerText = siteContent?.footer_text || "Made with love exploring the human experience";

  const socialLinks = [
    { key: "social_twitter", label: "Twitter/X" },
    { key: "social_instagram", label: "Instagram" },
    { key: "social_github", label: "GitHub" },
    { key: "social_linkedin", label: "LinkedIn" },
  ].filter((s) => siteContent?.[s.key]);

  return (
    <footer ref={ref} className="bg-pop-navy text-pop-cream mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-3xl text-pop-gold mb-4">
              LeCompte
            </h3>
            <p className="text-sm opacity-80">{tagline}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-teal">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/art" className="hover:text-pop-gold transition-colors">
                  Art Gallery
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-pop-gold transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/writing" className="hover:text-pop-gold transition-colors">
                  Writing
                </Link>
              </li>
              <li>
                <Link to="/experiments" className="hover:text-pop-gold transition-colors">
                  Experiments
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="hover:text-pop-gold transition-colors">
                  Experiences
                </Link>
              </li>
            </ul>
          </div>

          {/* Projects + Social */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-terracotta">
              Live Projects
            </h4>
            <ul className="space-y-2">
              {(liveProjects && liveProjects.length > 0 ? liveProjects : [
                { id: "1", title: "Notardex", external_url: "https://notardex.com", slug: "" },
                { id: "2", title: "Solutiodex", external_url: "https://solutiodex.com", slug: "" },
                { id: "3", title: "Zodaci", external_url: "https://zodaci.com", slug: "" },
              ]).map((project) => (
                <li key={project.id}>
                  {project.external_url ? (
                    <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="hover:text-pop-gold transition-colors inline-flex items-center gap-1">
                      {project.title} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link to={`/projects/${project.slug}`} className="hover:text-pop-gold transition-colors">
                      {project.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {socialLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-pop-cream/20">
                <ul className="space-y-2">
                  {socialLinks.map((s) => (
                    <li key={s.key}>
                      <a
                        href={siteContent?.[s.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-pop-gold transition-colors inline-flex items-center gap-1 text-sm"
                      >
                        {s.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-gold">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="hover:text-pop-teal transition-colors inline-flex items-center gap-1">
                  <Heart className="w-4 h-4" /> Support My Work
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-pop-teal transition-colors inline-flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Contact
                </Link>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-pop-cream/20">
              <SubscribeForm compact source="footer" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-pop-cream/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} LeCompte. All rights reserved.
          </p>
          <p className="text-sm">
            <Heart className="w-4 h-4 inline text-pop-terracotta" /> {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
