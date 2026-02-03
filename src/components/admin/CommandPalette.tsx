import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban,
  FileText,
  MessageSquare,
  Image,
  Newspaper,
  Plus,
  Clock,
  Settings,
  BarChart3,
  Beaker,
  ShoppingBag,
  Star,
  Heart,
  History,
  Target,
  Rocket,
  Briefcase,
  Sparkles,
  Users,
  Upload,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  href: string;
}

const NAVIGATION_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: BarChart3 },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Articles", href: "/admin/articles", icon: Newspaper },
  { label: "Updates", href: "/admin/updates", icon: MessageSquare },
  { label: "Experiments", href: "/admin/experiments", icon: Beaker },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Artwork", href: "/admin/artwork", icon: Image },
  { label: "Product Reviews", href: "/admin/product-reviews", icon: Star },
  { label: "Favorites", href: "/admin/favorites", icon: Heart },
  { label: "Life Periods", href: "/admin/life-periods", icon: History },
  { label: "Skills", href: "/admin/skills", icon: Target },
  { label: "Future Plans", href: "/admin/future-plans", icon: Rocket },
  { label: "Client Work", href: "/admin/client-work", icon: Briefcase },
  { label: "Experiences", href: "/admin/experiences", icon: Briefcase },
  { label: "AI Writer", href: "/admin/ai-writer", icon: Sparkles },
  { label: "Lead Finder", href: "/admin/leads", icon: Users },
  { label: "Bulk Import", href: "/admin/import", icon: Upload },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const QUICK_ACTIONS = [
  { label: "New Project", href: "/admin/projects/new", icon: Plus },
  { label: "New Article", href: "/admin/articles/new", icon: Plus },
  { label: "New Update", href: "/admin/updates/new", icon: Plus },
  { label: "New Experiment", href: "/admin/experiments/new", icon: Plus },
  { label: "New Product", href: "/admin/products/new", icon: Plus },
  { label: "New Product Review", href: "/admin/product-reviews/new", icon: Plus },
];

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch recent content items
  const { data: recentItems = [] } = useQuery({
    queryKey: ["command-palette-recent"],
    queryFn: async () => {
      const items: RecentItem[] = [];

      // Fetch recent projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .order("updated_at", { ascending: false })
        .limit(3);

      projects?.forEach((p) => {
        items.push({
          id: p.id,
          title: p.title,
          type: "project",
          href: `/admin/projects/${p.id}/edit`,
        });
      });

      // Fetch recent articles
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title")
        .order("updated_at", { ascending: false })
        .limit(3);

      articles?.forEach((a) => {
        items.push({
          id: a.id,
          title: a.title,
          type: "article",
          href: `/admin/articles/${a.id}/edit`,
        });
      });

      // Fetch recent updates
      const { data: updates } = await supabase
        .from("updates")
        .select("id, title")
        .order("updated_at", { ascending: false })
        .limit(2);

      updates?.forEach((u) => {
        items.push({
          id: u.id,
          title: u.title,
          type: "update",
          href: `/admin/updates/${u.id}/edit`,
        });
      });

      return items;
    },
    enabled: open,
    staleTime: 30000,
  });

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setSearch("");
      navigate(href);
    },
    [navigate, onOpenChange]
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "project":
        return FolderKanban;
      case "article":
        return Newspaper;
      case "update":
        return MessageSquare;
      default:
        return FileText;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search or jump to..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {item.type}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.href}
                onSelect={() => handleSelect(action.href)}
                className="gap-2"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{action.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                onSelect={() => handleSelect(item.href)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
