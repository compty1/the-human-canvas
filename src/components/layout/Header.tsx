import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogIn } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PopButton } from "@/components/pop-art";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Art", href: "/art" },
  { label: "Projects", href: "/projects" },
  { label: "Writing", href: "/writing" },
  { label: "Updates", href: "/updates" },
  { label: "Articles", href: "/articles" },
  { label: "Skills", href: "/skills" },
  { label: "Future", href: "/future" },
  { label: "Support", href: "/support" },
  { label: "About", href: "/about" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-4 border-foreground">
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
            {navItems.map((item) => (
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

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
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
          <button
            className="lg:hidden p-2 border-2 border-foreground"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-background border-t-2 border-foreground">
          <div className="container mx-auto px-4 py-4">
            {navItems.map((item) => (
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
