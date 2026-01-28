import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Filter, ExternalLink } from "lucide-react";

interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const ActivityLog = () => {
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as ActivityLogEntry[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    const matchesAction = !actionFilter || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesEntity = !entityFilter || log.entity_type?.toLowerCase().includes(entityFilter.toLowerCase());
    return matchesAction && matchesEntity;
  });

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-green-500/10 text-green-600";
    if (action.includes("update") || action.includes("edit")) return "bg-pop-yellow/10 text-pop-yellow";
    if (action.includes("delete") || action.includes("remove")) return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Activity Log</h1>
          <p className="text-muted-foreground">Track all admin actions and changes</p>
        </div>

        {/* Filters */}
        <ComicPanel className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold">Filters:</span>
            </div>
            <div className="flex-grow max-w-xs">
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
            <div className="flex-grow max-w-xs">
              <Input
                placeholder="Filter by entity type..."
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Logs */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : filteredLogs && filteredLogs.length > 0 ? (
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const { date, time } = formatDate(log.created_at);
              return (
                <ComicPanel key={log.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-xs font-bold text-muted-foreground">{date}</div>
                      <div className="text-xs text-muted-foreground">{time}</div>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.entity_type && (
                          <span className="text-xs text-muted-foreground">
                            on {log.entity_type}
                          </span>
                        )}
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify(log.details).slice(0, 100)}
                          {JSON.stringify(log.details).length > 100 && "..."}
                        </div>
                      )}

                      {log.entity_id && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {log.entity_id}
                        </div>
                      )}
                    </div>

                    {log.ip_address && (
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {log.ip_address}
                      </div>
                    )}
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No activity logs found</p>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default ActivityLog;
