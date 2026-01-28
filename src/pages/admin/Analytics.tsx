import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye,
  Users,
  Clock,
  MousePointer,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#FF6B9D", "#00D4FF", "#FFE600", "#FF8C42", "#9B5DE5"];

const Analytics = () => {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  const daysAgo = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysAgo));

  // Fetch page views
  const { data: pageViews } = useQuery({
    queryKey: ["analytics-page-views", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_views")
        .select("*")
        .gte("timestamp", startDate.toISOString())
        .order("timestamp", { ascending: true });
      return data || [];
    },
  });

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ["analytics-sessions", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .gte("started_at", startDate.toISOString());
      return data || [];
    },
  });

  // Fetch link clicks
  const { data: linkClicks } = useQuery({
    queryKey: ["analytics-clicks", dateRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("link_clicks")
        .select("*")
        .gte("timestamp", startDate.toISOString());
      return data || [];
    },
  });

  // Process data for charts
  const dailyViews = pageViews?.reduce((acc, view) => {
    const day = format(new Date(view.timestamp), "MMM d");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dailyViewsData = Object.entries(dailyViews || {}).map(([date, count]) => ({
    date,
    views: count,
  }));

  // Device breakdown
  const deviceBreakdown = pageViews?.reduce((acc, view) => {
    const device = view.device_type || "unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceBreakdown || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Top pages
  const pageBreakdown = pageViews?.reduce((acc, view) => {
    acc[view.page_path] = (acc[view.page_path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPages = Object.entries(pageBreakdown || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Top clicked links
  const linkBreakdown = linkClicks?.reduce((acc, click) => {
    const key = click.link_text || click.link_url;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLinks = Object.entries(linkBreakdown || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([link, count]) => ({ link, count }));

  // Average time on page
  const avgTimeOnPage =
    pageViews && pageViews.length > 0
      ? Math.round(
          pageViews.reduce((sum, v) => sum + (v.time_on_page_seconds || 0), 0) /
            pageViews.filter((v) => v.time_on_page_seconds).length || 1
        )
      : 0;

  // Unique visitors
  const uniqueVisitors = new Set(pageViews?.map((v) => v.visitor_id)).size;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-display gradient-text">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track your portfolio's performance
            </p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 font-bold border-2 border-foreground ${
                  dateRange === range
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ComicPanel className="p-6 bg-pop-cyan">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8" />
              <div>
                <p className="text-sm font-bold uppercase">Page Views</p>
                <p className="text-3xl font-display">{pageViews?.length || 0}</p>
              </div>
            </div>
          </ComicPanel>

          <ComicPanel className="p-6 bg-pop-magenta">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <p className="text-sm font-bold uppercase">Unique Visitors</p>
                <p className="text-3xl font-display">{uniqueVisitors}</p>
              </div>
            </div>
          </ComicPanel>

          <ComicPanel className="p-6 bg-pop-yellow text-foreground">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8" />
              <div>
                <p className="text-sm font-bold uppercase">Avg. Time</p>
                <p className="text-3xl font-display">{avgTimeOnPage}s</p>
              </div>
            </div>
          </ComicPanel>

          <ComicPanel className="p-6 bg-pop-orange">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8" />
              <div>
                <p className="text-sm font-bold uppercase">Link Clicks</p>
                <p className="text-3xl font-display">{linkClicks?.length || 0}</p>
              </div>
            </div>
          </ComicPanel>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Views Chart */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Daily Page Views
            </h2>
            <div className="h-64">
              {dailyViewsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyViewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#FF6B9D"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data for this period
                </div>
              )}
            </div>
          </ComicPanel>

          {/* Device Breakdown */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Device Breakdown
            </h2>
            <div className="h-64 flex items-center justify-center">
              {deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {deviceData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground">No data yet</div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm">Desktop</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">Mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4" />
                <span className="text-sm">Tablet</span>
              </div>
            </div>
          </ComicPanel>
        </div>

        {/* Top Pages & Links */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Top Pages
            </h2>
            <div className="space-y-2">
              {topPages.length > 0 ? (
                topPages.map((page, i) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between p-3 bg-muted border-2 border-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="font-bold">{page.page}</span>
                    </div>
                    <span className="text-sm bg-primary text-primary-foreground px-2 py-1">
                      {page.count} views
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No page views recorded yet
                </p>
              )}
            </div>
          </ComicPanel>

          {/* Top Clicked Links */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Top Clicked Links
            </h2>
            <div className="space-y-2">
              {topLinks.length > 0 ? (
                topLinks.map((link, i) => (
                  <div
                    key={link.link}
                    className="flex items-center justify-between p-3 bg-muted border-2 border-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="font-bold truncate max-w-[200px]">
                        {link.link}
                      </span>
                    </div>
                    <span className="text-sm bg-pop-magenta text-background px-2 py-1">
                      {link.count} clicks
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No link clicks recorded yet
                </p>
              )}
            </div>
          </ComicPanel>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
