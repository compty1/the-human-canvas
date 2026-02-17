import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADMIN_ROUTES, PUBLISHABLE_TABLES, CONTENT_FIELDS } from "@/lib/adminRoutes";
import { AlertTriangle, FileText, Clock, Eye, Sparkles, FolderOpen, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Suggestion {
  id: string;
  type: "missing_content" | "unpublished" | "stale" | "empty_table" | "seo_gap";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  table: string;
  records?: { id: string; title: string }[];
  fixPrompt?: string;
}

interface ContentSuggestionsProps {
  onSendToChat?: (prompt: string) => void;
}

// Base fields that exist on most tables
const BASE_FIELDS = ["id", "title", "name", "slug", "updated_at", "published", "review_status"];

// Build per-table select strings using only columns that actually exist
function getSelectFields(table: string): string {
  const contentFields = CONTENT_FIELDS[table] || [];
  const allFields = [...new Set([...BASE_FIELDS, ...contentFields])];
  return allFields.join(", ");
}

export const ContentSuggestions = ({ onSendToChat }: ContentSuggestionsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["content-suggestions"],
    queryFn: async () => {
      const results: Suggestion[] = [];
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const tables = Object.keys(CONTENT_FIELDS);

      await Promise.all(
        tables.map(async (table) => {
          try {
            const selectStr = getSelectFields(table);
            const { data: allData } = await (supabase.from(table as any) as any).select(selectStr);
            const items = allData || [];

            if (items.length === 0) {
              results.push({
                id: `empty-${table}`,
                type: "empty_table",
                severity: "low",
                title: `No ${table.replace(/_/g, " ")} yet`,
                description: `The ${table.replace(/_/g, " ")} section is empty.`,
                table,
                fixPrompt: `Create some initial ${table.replace(/_/g, " ")} content for my portfolio site.`,
              });
              return;
            }

            // Check unpublished drafts
            if (PUBLISHABLE_TABLES.includes(table)) {
              const unpublished = items.filter((i: any) => i.published === false);
              if (unpublished.length > 0) {
                results.push({
                  id: `unpub-${table}`,
                  type: "unpublished",
                  severity: "medium",
                  title: `${unpublished.length} unpublished ${table.replace(/_/g, " ")}`,
                  description: `These items are in draft and may be ready to publish.`,
                  table,
                  records: unpublished.slice(0, 5).map((i: any) => ({ id: i.id, title: i.title || i.name || i.slug })),
                  fixPrompt: `Review these unpublished ${table.replace(/_/g, " ")} and suggest which ones are ready to publish: ${unpublished.slice(0, 5).map((i: any) => i.title || i.name).join(", ")}`,
                });
              }
            }

            // Check missing content fields - only for fields that exist in this table's CONTENT_FIELDS
            const fields = CONTENT_FIELDS[table] || [];
            for (const field of fields) {
              const missing = items.filter((i: any) => {
                // Only check if the field key actually exists in the returned data
                if (!(field in i)) return false;
                const val = i[field];
                if (val === null || val === undefined) return true;
                if (typeof val === "string" && val.trim() === "") return true;
                if (Array.isArray(val) && val.length === 0) return true;
                return false;
              });
              if (missing.length > 0) {
                results.push({
                  id: `missing-${table}-${field}`,
                  type: "missing_content",
                  severity: field === "description" || field === "content" ? "high" : "medium",
                  title: `${missing.length} ${table.replace(/_/g, " ")} missing ${field.replace(/_/g, " ")}`,
                  description: `These records have no ${field.replace(/_/g, " ")} set.`,
                  table,
                  records: missing.slice(0, 5).map((i: any) => ({ id: i.id, title: i.title || i.name || i.slug })),
                  fixPrompt: `Generate ${field.replace(/_/g, " ")} for these ${table.replace(/_/g, " ")}: ${missing.slice(0, 5).map((i: any) => `"${i.title || i.name}" (id: ${i.id})`).join(", ")}`,
                });
              }
            }

            // Check stale content
            const stale = items.filter((i: any) => i.updated_at && i.updated_at < ninetyDaysAgo);
            if (stale.length > 0) {
              results.push({
                id: `stale-${table}`,
                type: "stale",
                severity: "low",
                title: `${stale.length} stale ${table.replace(/_/g, " ")}`,
                description: `Not updated in over 90 days.`,
                table,
                records: stale.slice(0, 5).map((i: any) => ({ id: i.id, title: i.title || i.name || i.slug })),
                fixPrompt: `Review and suggest updates for these stale ${table.replace(/_/g, " ")}: ${stale.slice(0, 5).map((i: any) => i.title || i.name).join(", ")}`,
              });
            }
          } catch {
            // table query failed, skip
          }
        })
      );

      const order = { high: 0, medium: 1, low: 2 };
      results.sort((a, b) => order[a.severity] - order[b.severity]);
      return results;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
    refetch();
  };

  const severityIcon = (s: string) => {
    if (s === "high") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (s === "medium") return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Eye className="w-4 h-4 text-muted-foreground" />;
  };

  const typeColor = (t: string) => {
    if (t === "missing_content") return "destructive";
    if (t === "unpublished") return "secondary";
    if (t === "stale") return "outline";
    if (t === "empty_table") return "outline";
    return "default";
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
        <p>Analyzing content...</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Sparkles className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">All content looks great!</p>
        <p className="text-sm mt-1">No suggestions at this time.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{suggestions.length} suggestions found</p>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRefresh} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Refresh
        </Button>
      </div>
      {suggestions.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{severityIcon(s.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{s.title}</span>
                <Badge variant={typeColor(s.type) as any} className="text-[10px]">
                  {s.type.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>

              {s.records && s.records.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.records.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const route = ADMIN_ROUTES[s.table];
                        if (route) navigate(route.editor(r.id));
                      }}
                      className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-accent transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      {r.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {s.fixPrompt && onSendToChat && (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs"
                    onClick={() => onSendToChat(s.fixPrompt!)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Fix with AI
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    const route = ADMIN_ROUTES[s.table];
                    if (route) navigate(route.manager);
                  }}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  Open Manager
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/** Export suggestion count for external use */
export const useSuggestionsCount = () => {
  const { data } = useQuery({
    queryKey: ["content-suggestions"],
    enabled: false, // Don't refetch, just read from cache
  });
  return (data as Suggestion[] | undefined)?.length ?? 0;
};
