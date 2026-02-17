import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ContentHubChat } from "@/components/admin/ContentHubChat";
import { ChangeHistoryPanel } from "@/components/admin/ChangeHistoryPanel";
import { ContentPlanCard } from "@/components/admin/ContentPlanCard";
import { useContentActions, ContentPlan } from "@/hooks/useContentActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Trash2, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ContentHub = () => {
  const queryClient = useQueryClient();
  const { fetchSiteContext } = useContentActions();

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

  // Content overview counts
  const { data: contentStats } = useQuery({
    queryKey: ["content-overview-stats"],
    queryFn: async () => {
      const tables = [
        "articles", "updates", "projects", "artwork", "experiments",
        "favorites", "inspirations", "experiences", "certifications",
        "client_projects", "skills", "products",
      ];
      const counts: Record<string, number> = {};
      await Promise.all(
        tables.map(async (table) => {
          try {
            const { data, error } = await (supabase.from(table as any) as any)
              .select("id");
            counts[table] = error ? 0 : (data?.length ?? 0);
          } catch {
            counts[table] = 0;
          }
        })
      );
      return counts;
    },
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

              <Tabs defaultValue="history">
                <TabsList>
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
                              // Delete from saved after execution
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
                      {Object.entries(contentStats).map(([table, count]) => (
                        <div key={table} className="border rounded-lg p-4 bg-card">
                          <div className="flex items-center gap-2 mb-1">
                            <Database className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-mono text-muted-foreground">
                              {table.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <ContentHubChat />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AdminLayout>
  );
};

export default ContentHub;
