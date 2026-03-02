import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ComicPanel } from "@/components/pop-art";
import { Clock, FileText, Image, Beaker, Heart, Briefcase, Star, History, Sparkles, FolderKanban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ADMIN_ROUTES } from "@/lib/adminRoutes";

interface RecentItem {
  id: string;
  label: string;
  table: string;
  updated_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  articles: FileText,
  projects: FolderKanban,
  updates: FileText,
  artwork: Image,
  experiments: Beaker,
  favorites: Heart,
  experiences: Briefcase,
  product_reviews: Star,
  life_periods: History,
  inspirations: Sparkles,
  client_projects: Briefcase,
};

const TYPE_LABELS: Record<string, string> = {
  articles: "Article",
  projects: "Project",
  updates: "Update",
  artwork: "Artwork",
  experiments: "Experiment",
  favorites: "Favorite",
  experiences: "Experience",
  product_reviews: "Review",
  life_periods: "Life Period",
  inspirations: "Inspiration",
  client_projects: "Client Project",
};

export const RecentEditsWidget = () => {
  const { data: recentItems = [] } = useQuery({
    queryKey: ["admin-recent-edits"],
    queryFn: async () => {
      const tables = [
        { name: "articles", label: "title" },
        { name: "projects", label: "title" },
        { name: "updates", label: "title" },
        { name: "experiments", label: "name" },
        { name: "experiences", label: "title" },
        { name: "product_reviews", label: "product_name" },
        { name: "client_projects", label: "project_name" },
      ];

      const queries = tables.map((t) =>
        supabase
          .from(t.name as any)
          .select(`id, ${t.label}, updated_at`)
          .order("updated_at", { ascending: false })
          .limit(3)
          .then(({ data }) =>
            (data || []).map((row: any) => ({
              id: row.id,
              label: row[t.label],
              table: t.name,
              updated_at: row.updated_at,
            }))
          )
      );

      const results = await Promise.all(queries);
      return results
        .flat()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
    },
  });

  if (recentItems.length === 0) return null;

  return (
    <ComicPanel className="p-6">
      <h2 className="text-xl font-display mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent Edits
      </h2>
      <div className="space-y-2">
        {recentItems.map((item) => {
          const Icon = TYPE_ICONS[item.table] || FileText;
          const route = ADMIN_ROUTES[item.table];
          const href = route ? route.editor(item.id) : "#";
          return (
            <Link
              key={`${item.table}-${item.id}`}
              to={href}
              className="flex items-center gap-3 p-2 hover:bg-muted rounded transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-sm font-bold truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[item.table] || item.table}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
              </span>
            </Link>
          );
        })}
      </div>
    </ComicPanel>
  );
};
