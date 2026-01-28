import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye,
  FileText,
  Image,
  FolderKanban,
  Users,
  TrendingUp,
  Clock,
  MousePointer,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href?: string;
}

const StatCard = ({ title, value, icon: Icon, color, href }: StatCardProps) => {
  const content = (
    <ComicPanel className={`p-6 ${color} border-foreground`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide opacity-80">
            {title}
          </p>
          <p className="text-3xl font-display mt-2">{value}</p>
        </div>
        <Icon className="w-10 h-10 opacity-50" />
      </div>
    </ComicPanel>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
};

const Dashboard = () => {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pageViews, projects, articles, updates, artwork, leads, sessions] =
        await Promise.all([
          supabase.from("page_views").select("id", { count: "exact" }),
          supabase.from("projects").select("id", { count: "exact" }),
          supabase.from("articles").select("id", { count: "exact" }),
          supabase.from("updates").select("id", { count: "exact" }),
          supabase.from("artwork").select("id", { count: "exact" }),
          supabase.from("leads").select("id", { count: "exact" }),
          supabase.from("sessions").select("id", { count: "exact" }),
        ]);

      return {
        pageViews: pageViews.count || 0,
        projects: projects.count || 0,
        articles: articles.count || 0,
        updates: updates.count || 0,
        artwork: artwork.count || 0,
        leads: leads.count || 0,
        sessions: sessions.count || 0,
      };
    },
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Fetch recent page views
  const { data: recentViews } = useQuery({
    queryKey: ["admin-recent-views"],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_views")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display gradient-text">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your portfolio.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Page Views"
            value={stats?.pageViews || 0}
            icon={Eye}
            color="bg-pop-cyan"
            href="/admin/analytics"
          />
          <StatCard
            title="Sessions"
            value={stats?.sessions || 0}
            icon={Users}
            color="bg-pop-magenta"
            href="/admin/analytics"
          />
          <StatCard
            title="Projects"
            value={stats?.projects || 0}
            icon={FolderKanban}
            color="bg-pop-yellow text-foreground"
            href="/admin/projects"
          />
          <StatCard
            title="Articles"
            value={stats?.articles || 0}
            icon={FileText}
            color="bg-pop-orange"
            href="/admin/articles"
          />
          <StatCard
            title="Updates"
            value={stats?.updates || 0}
            icon={TrendingUp}
            color="bg-secondary"
            href="/admin/updates"
          />
          <StatCard
            title="Artwork"
            value={stats?.artwork || 0}
            icon={Image}
            color="bg-primary text-primary-foreground"
            href="/admin/artwork"
          />
          <StatCard
            title="Leads"
            value={stats?.leads || 0}
            icon={Users}
            color="bg-accent text-accent-foreground"
            href="/admin/leads"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Page Views */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Page Views
            </h2>
            <div className="space-y-3">
              {recentViews && recentViews.length > 0 ? (
                recentViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between p-3 bg-muted border-2 border-foreground"
                  >
                    <div>
                      <p className="font-bold">{view.page_path}</p>
                      <p className="text-sm text-muted-foreground">
                        {view.device_type} • {view.country || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{format(new Date(view.timestamp), "MMM d, h:mm a")}</p>
                      {view.time_on_page_seconds && (
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {view.time_on_page_seconds}s
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No page views recorded yet.
                </p>
              )}
            </div>
          </ComicPanel>

          {/* Recent Activity */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-muted border-2 border-foreground"
                  >
                    <div>
                      <p className="font-bold">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.entity_type}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded yet.
                </p>
              )}
            </div>
          </ComicPanel>
        </div>

        {/* Quick Actions */}
        <ComicPanel className="p-6 bg-foreground text-background">
          <h2 className="text-xl font-display mb-4 text-pop-yellow">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/articles/new"
              className="px-4 py-2 bg-pop-cyan text-foreground font-bold border-2 border-background hover:translate-y-[-2px] transition-transform"
            >
              + New Article
            </Link>
            <Link
              to="/admin/updates/new"
              className="px-4 py-2 bg-pop-magenta text-background font-bold border-2 border-background hover:translate-y-[-2px] transition-transform"
            >
              + New Update
            </Link>
            <Link
              to="/admin/projects/new"
              className="px-4 py-2 bg-pop-yellow text-foreground font-bold border-2 border-background hover:translate-y-[-2px] transition-transform"
            >
              + New Project
            </Link>
            <Link
              to="/admin/ai-writer"
              className="px-4 py-2 bg-pop-orange text-background font-bold border-2 border-background hover:translate-y-[-2px] transition-transform"
            >
              ✨ AI Writer
            </Link>
            <Link
              to="/admin/leads"
              className="px-4 py-2 bg-secondary text-secondary-foreground font-bold border-2 border-background hover:translate-y-[-2px] transition-transform"
            >
              🔍 Find Leads
            </Link>
          </div>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
