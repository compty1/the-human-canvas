import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Image,
  FolderKanban,
  Newspaper,
  MessageSquare,
  Palette,
  Target,
  Lightbulb,
  Rocket,
  Users,
  Upload,
  Sparkles,
  StickyNote,
  Settings,
  Activity,
  LogOut,
  ChevronLeft,
  Briefcase,
  Heart,
  History,
  DollarSign,
  Clock,
  TrendingUp,
  ChevronRight,
  Menu,
  Home,
  Info,
  Star,
  Beaker,
  ShoppingBag,
  Gift,
  Command,
  ExternalLink,
} from "lucide-react";
import { PopButton } from "@/components/pop-art";
import { toast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Site Settings", href: "/admin/content/site", icon: Settings },
      { label: "Home Page", href: "/admin/content/home", icon: Home },
      { label: "About Page", href: "/admin/content/about", icon: Info },
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "Client Work", href: "/admin/client-work", icon: Briefcase },
      { label: "Experiments", href: "/admin/experiments", icon: Beaker },
      { label: "Products", href: "/admin/products", icon: ShoppingBag },
      { label: "Articles", href: "/admin/articles", icon: Newspaper },
      { label: "Updates", href: "/admin/updates", icon: MessageSquare },
      { label: "Product Reviews", href: "/admin/product-reviews", icon: Star },
      { label: "Artwork", href: "/admin/artwork", icon: Image },
      { label: "Favorites", href: "/admin/favorites", icon: Heart },
      { label: "Inspirations", href: "/admin/inspirations", icon: Sparkles },
      { label: "Life Periods", href: "/admin/life-periods", icon: History },
      { label: "Skills", href: "/admin/skills", icon: Palette },
      { label: "Learning Goals", href: "/admin/learning-goals", icon: Target },
      { label: "Future Plans", href: "/admin/future-plans", icon: Rocket },
      { label: "Supplies", href: "/admin/supplies", icon: Lightbulb },
      { label: "Experiences", href: "/admin/experiences", icon: Briefcase },
      { label: "Certifications", href: "/admin/certifications", icon: Target },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "AI Content Hub", href: "/admin/content-hub", icon: Sparkles },
      { label: "Quick Capture", href: "/admin/quick-capture", icon: Sparkles },
      { label: "Media Library", href: "/admin/media-library", icon: Image },
      { label: "Content Library", href: "/admin/content-library", icon: FileText },
      { label: "Content Review", href: "/admin/content-review", icon: FileText },
      { label: "Time Tracker", href: "/admin/time-tracker", icon: Clock },
      { label: "Sales Data", href: "/admin/sales", icon: DollarSign },
      { label: "Funding Campaigns", href: "/admin/funding-campaigns", icon: TrendingUp },
      { label: "Contributions", href: "/admin/contributions", icon: Gift },
      { label: "AI Copy Generator", href: "/admin/ai-writer", icon: Sparkles },
      { label: "Bulk Import", href: "/admin/import", icon: Upload },
      { label: "Lead Finder", href: "/admin/leads", icon: Users },
      { label: "Notes & Ideas", href: "/admin/notes", icon: StickyNote },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Activity Log", href: "/admin/activity", icon: Activity },
    ],
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Global Ctrl+K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check admin access
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl font-display">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-4xl font-display mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access the admin area.
        </p>
        <Link to="/">
          <PopButton>Return Home</PopButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border-2 border-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-foreground text-background border-r-4 border-foreground z-40 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b-2 border-background/20 flex items-center justify-between">
          {!collapsed && (
            <Link to="/admin" className="text-xl font-display text-pop-yellow">
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-background/10 rounded hidden lg:block"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 overflow-y-auto h-[calc(100vh-140px)]">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-background/50">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded transition-colors",
                          isActive
                            ? "bg-pop-yellow text-foreground font-bold"
                            : "hover:bg-background/10"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Command Palette Trigger & Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t-2 border-background/20 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 w-full rounded hover:bg-background/10 transition-colors"
            title={collapsed ? "View Site" : undefined}
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>View Site</span>}
          </Link>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-3 px-3 py-2 w-full rounded hover:bg-background/10 transition-colors"
            title={collapsed ? "Command Palette (Ctrl+K)" : undefined}
          >
            <Command className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Search</span>
                <kbd className="text-xs bg-background/20 px-1.5 py-0.5 rounded">⌘K</kbd>
              </div>
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full rounded hover:bg-background/10 transition-colors"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
