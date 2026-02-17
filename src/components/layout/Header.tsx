import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogIn, Settings, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { PopButton } from "@/components/pop-art";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultNavItems = [
  { label: "Art", href: "/art" },
  { label: "Projects", href: "/projects" },
  { label: "Client Work", href: "/client-work" },
  { label: "Experiences", href: "/experiences" },
  { label: "UX Reviews", href: "/product-reviews" },
  { label: "Experiments", href: "/experiments" },
  { label: "Skills", href: "/skills" },
  { label: "Store", href: "/store" },
  { label: "Writing", href: "/writing" },
  { label: "Favorites", href: "/favorites" },
  { label: "Inspirations", href: "/inspirations" },
  { label: "Timeline", href: "/timeline" },
  { label: "Certifications", href: "/certifications" },
  { label: "Support", href: "/support" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { theme, setTheme } = useTheme();

  // Fetch nav items from DB, fall back to defaults
  const { data: dbNavItems } = useQuery({
    queryKey: ["site-content-nav-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "nav_items")
        .maybeSingle();
      if (error || !data?.content_value) return null;
      try {
        const parsed = JSON.parse(data.content_value);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const navItems = (dbNavItems || defaultNavItems).filter(
    (item: { visible?: boolean }) => item.visible !== false
  );

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b-4 border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-3xl text-primary tracking-wider">
              LeCompte
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item: { label: string; href: string }) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-4 py-2 font-bold uppercase text-sm tracking-wide transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons + Dark Mode */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border-2 border-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 bg-pop-gold border-2 border-foreground hover:bg-pop-gold/80 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-bold text-sm">Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 border-2 border-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="font-bold text-sm">Profile</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 font-bold text-sm hover:text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/auth">
                <PopButton size="sm" variant="primary">
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </PopButton>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border-2 border-foreground"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              className="p-2 border-2 border-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-background border-t-2 border-foreground">
          <div className="container mx-auto px-4 py-4">
            {navItems.map((item: { label: string; href: string }) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "block py-3 font-bold uppercase tracking-wide border-b-2 border-muted",
                  location.pathname === item.href
                    ? "text-primary"
                    : "hover:text-primary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t-2 border-foreground">
              {user ? (
                <div className="space-y-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block py-2 font-bold text-pop-gold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block py-2 font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block py-2 font-bold text-destructive"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <PopButton size="sm" className="w-full justify-center">
                    Sign In
                  </PopButton>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
