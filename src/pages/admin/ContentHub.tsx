import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ContentHubChat } from "@/components/admin/ContentHubChat";
import { ChangeHistoryPanel } from "@/components/admin/ChangeHistoryPanel";
import { ContentPlanCard } from "@/components/admin/ContentPlanCard";
import { ContentSuggestions } from "@/components/admin/ContentSuggestions";
import { useContentActions, ContentPlan } from "@/hooks/useContentActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Trash2, Database, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ADMIN_ROUTES, PUBLISHABLE_TABLES } from "@/lib/adminRoutes";

const ContentHub = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { fetchSiteContext } = useContentActions();
  const [chatInputOverride, setChatInputOverride] = useState<string | null>(null);

  const handleSendToChat = useCallback((prompt: string) => {
    setChatInputOverride(prompt);
  }, []);

  // Saved plans
  const { data: savedPlans, refetch: refetchSaved } = useQuery({
    queryKey: ["ai-saved-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_content_plans")
        .select("*")
        .eq("status", "saved")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Content overview counts with published breakdown
  const { data: contentStats } = useQuery({
    queryKey: ["content-overview-stats"],
    queryFn: async () => {
      const tables = [
        "articles", "updates", "projects", "artwork", "experiments",
        "favorites", "inspirations", "experiences", "certifications",
        "client_projects", "skills", "products", "product_reviews",
        "life_periods", "learning_goals", "funding_campaigns", "supplies_needed",
      ];
      const counts: Record<string, { total: number; published?: number; draft?: number }> = {};
      await Promise.all(
        tables.map(async (table) => {
          try {
            const { data } = await (supabase.from(table as any) as any).select("id, published");
            const items = data || [];
            const total = items.length;
            if (PUBLISHABLE_TABLES.includes(table)) {
              const published = items.filter((i: any) => i.published === true).length;
              counts[table] = { total, published, draft: total - published };
            } else {
              counts[table] = { total };
            }
          } catch {
            counts[table] = { total: 0 };
          }
        })
      );
      return counts;
    },
  });

  // Suggestions count
  const { data: suggestionsCount } = useQuery({
    queryKey: ["content-suggestions-count"],
    queryFn: async () => {
      // Lightweight check - just count empty descriptions across key tables
      let count = 0;
      const tables = ["articles", "projects", "experiments", "experiences"];
      await Promise.all(
        tables.map(async (table) => {
          try {
            const { data } = await (supabase.from(table as any) as any)
              .select("id, description, published")
              .or("description.is.null,description.eq.");
            count += (data?.length || 0);
            if (PUBLISHABLE_TABLES.includes(table)) {
              const { data: unpub } = await (supabase.from(table as any) as any)
                .select("id")
                .eq("published", false);
              count += (unpub?.length || 0);
            }
          } catch {}
        })
      );
      return count;
    },
    staleTime: 60_000,
  });

  const handleDeleteSavedPlan = async (planId: string) => {
    await supabase.from("ai_content_plans").delete().eq("id", planId);
    refetchSaved();
    toast({ title: "Plan deleted" });
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)]">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Dashboard */}
          <ResizablePanel defaultSize={60} minSize={35}>
            <div className="h-full overflow-y-auto p-6">
              <h1 className="text-3xl font-display font-bold mb-6">AI Content Hub</h1>

              <Tabs defaultValue="suggestions">
                <TabsList>
                  <TabsTrigger value="suggestions">
                    Suggestions
                    {suggestionsCount && suggestionsCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-[10px] px-1.5">
                        {suggestionsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history">Recent Changes</TabsTrigger>
                  <TabsTrigger value="saved">
                    Saved Plans
                    {savedPlans && savedPlans.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                        {savedPlans.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="overview">Content Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="mt-4">
                  <ContentSuggestions onSendToChat={handleSendToChat} />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <ChangeHistoryPanel />
                </TabsContent>

                <TabsContent value="saved" className="mt-4">
                  {savedPlans && savedPlans.length > 0 ? (
                    <div className="space-y-4">
                      {savedPlans.map((plan) => (
                        <div key={plan.id} className="relative">
                          <ContentPlanCard
                            plan={{
                              title: plan.title,
                              summary: plan.description || "",
                              actions: (plan.actions as any) || [],
                            }}
                            conversationId={plan.conversation_id || undefined}
                            onExecuted={() => {
                              refetchSaved();
                              queryClient.invalidateQueries({ queryKey: ["ai-content-plans-history"] });
                              queryClient.invalidateQueries({ queryKey: ["ai-change-history"] });
                              queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
                              supabase
                                .from("ai_content_plans")
                                .delete()
                                .eq("id", plan.id)
                                .then(() => refetchSaved());
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => handleDeleteSavedPlan(plan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No saved plans</p>
                      <p className="text-sm mt-1">Plans you save for later will appear here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="overview" className="mt-4">
                  {contentStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(contentStats).map(([table, stats]) => {
                        const route = ADMIN_ROUTES[table];
                        return (
                          <button
                            key={table}
                            onClick={() => route && navigate(route.manager)}
                            className="border rounded-lg p-4 bg-card text-left hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Database className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {table.replace(/_/g, " ")}
                              </span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
                            </div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            {stats.published !== undefined && (
                              <div className="flex gap-2 mt-1 text-[10px]">
                                <span className="text-green-600">{stats.published} published</span>
                                <span className="text-muted-foreground">{stats.draft} draft</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <ContentHubChat
              externalPrompt={chatInputOverride}
              onExternalPromptConsumed={() => setChatInputOverride(null)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AdminLayout>
  );
};

export default ContentHub;
