import { Link } from "react-router-dom";
import { Heart, Mail, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-3xl text-pop-yellow mb-4">
              LeCompte
            </h3>
            <p className="text-sm opacity-80">
              Exploring the human experience through art, technology, and words.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-cyan">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/art" className="hover:text-pop-yellow transition-colors">
                  Art Gallery
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-pop-yellow transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/writing" className="hover:text-pop-yellow transition-colors">
                  Writing
                </Link>
              </li>
            </ul>
          </div>

          {/* Projects */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-magenta">
              Live Projects
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://notardex.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pop-yellow transition-colors inline-flex items-center gap-1"
                >
                  Notardex <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://solutiodex.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pop-yellow transition-colors inline-flex items-center gap-1"
                >
                  Solutiodex <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://zodaci.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pop-yellow transition-colors inline-flex items-center gap-1"
                >
                  Zodaci <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4 text-pop-yellow">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/support"
                  className="hover:text-pop-cyan transition-colors inline-flex items-center gap-1"
                >
                  <Heart className="w-4 h-4" /> Support My Work
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-pop-cyan transition-colors inline-flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" /> Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-60">
            © {new Date().getFullYear()} LeCompte. All rights reserved.
          </p>
          <p className="text-sm">
            Made with <Heart className="w-4 h-4 inline text-pop-magenta" /> exploring the human experience
          </p>
        </div>
      </div>
    </footer>
  );
};
