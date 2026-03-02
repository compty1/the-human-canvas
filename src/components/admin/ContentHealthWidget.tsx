import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ComicPanel } from "@/components/pop-art";
import { AlertTriangle, Check, FileText, ImageOff } from "lucide-react";

interface HealthStat {
  label: string;
  count: number;
  color: string;
  icon: React.ElementType;
}

export const ContentHealthWidget = () => {
  const { data: health } = useQuery({
    queryKey: ["admin-content-health"],
    queryFn: async () => {
      const draftArticles = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("published", false);
      const publishedArticles = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("published", true);
      const noDescArticles = await supabase.from("articles").select("id", { count: "exact", head: true }).is("excerpt", null);
      const draftUpdates = await supabase.from("updates").select("id", { count: "exact", head: true }).eq("published", false);
      const draftProjects = await (supabase.from("projects").select("id", { count: "exact", head: true }) as any).eq("published", false);
      const noDescExperiments = await supabase.from("experiments").select("id", { count: "exact", head: true }).is("description", null);
      const noImageArtwork = await supabase.from("artwork").select("id", { count: "exact", head: true }).eq("image_url", "/placeholder.svg");

      return {
        drafts: (draftArticles.count || 0) + (draftUpdates.count || 0) + (draftProjects.count || 0),
        published: publishedArticles.count || 0,
        missingDescriptions: (noDescArticles.count || 0) + (noDescExperiments.count || 0),
        missingImages: noImageArtwork.count || 0,
      };
    },
  });

  if (!health) return null;

  const stats: HealthStat[] = [
    { label: "Drafts", count: health.drafts, color: "bg-pop-yellow text-foreground", icon: FileText },
    { label: "Published", count: health.published, color: "bg-pop-green text-foreground", icon: Check },
    { label: "Missing Desc.", count: health.missingDescriptions, color: "bg-pop-orange text-foreground", icon: AlertTriangle },
    { label: "Missing Images", count: health.missingImages, color: "bg-destructive text-destructive-foreground", icon: ImageOff },
  ];

  return (
    <ComicPanel className="p-6">
      <h2 className="text-xl font-display mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Content Health
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to="/admin/content-library"
              className={`${stat.color} p-4 border-2 border-foreground hover:translate-y-[-2px] transition-transform`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{stat.label}</span>
              </div>
              <p className="text-2xl font-display">{stat.count}</p>
            </Link>
          );
        })}
      </div>
    </ComicPanel>
  );
};
