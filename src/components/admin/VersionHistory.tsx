import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryProps {
  contentType: string;
  contentId: string;
  onRestore: (data: Record<string, unknown>) => void;
  trigger?: React.ReactNode;
}

interface ContentVersion {
  id: string;
  content_type: string;
  content_id: string;
  version_data: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export const VersionHistory = ({
  contentType,
  contentId,
  onRestore,
  trigger,
}: VersionHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ContentVersion | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["content-versions", contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_versions")
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ContentVersion[];
    },
    enabled: open && !!contentId,
  });

  const handleRestore = (version: ContentVersion) => {
    onRestore(version.version_data);
    setOpen(false);
    toast.success("Version restored");
  };

  const getVersionTitle = (version: ContentVersion) => {
    const data = version.version_data;
    return (data.title as string) || (data.name as string) || "Untitled";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-foreground hover:bg-muted transition-colors">
            <History className="w-4 h-4" />
            History
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : versions && versions.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-4 border-2 border-foreground ${
                      previewVersion?.id === version.id ? "bg-pop-yellow/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-pop-cyan">
                              Latest
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(version.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="font-bold truncate">{getVersionTitle(version)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setPreviewVersion(
                              previewVersion?.id === version.id ? null : version
                            )
                          }
                          className="p-2 hover:bg-muted transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestore(version)}
                          className="p-2 hover:bg-pop-yellow transition-colors"
                          title="Restore this version"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview panel */}
                    {previewVersion?.id === version.id && (
                      <div className="mt-4 p-3 bg-muted/50 border border-foreground/20 text-sm">
                        <p className="font-bold mb-2">Version Data Preview:</p>
                        <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {JSON.stringify(version.version_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No version history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Versions are saved automatically when you save content
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper function to save a new version
export const saveContentVersion = async (
  contentType: string,
  contentId: string,
  versionData: Record<string, unknown>
) => {
  try {
    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("content_versions").insert({
      content_type: contentType,
      content_id: contentId,
      version_data: versionData as Json,
      created_by: user?.id || null,
    });

    if (error) throw error;

    // Clean up old versions (keep only last 20)
    const { data: oldVersions } = await supabase
      .from("content_versions")
      .select("id")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false })
      .range(20, 100);

    if (oldVersions && oldVersions.length > 0) {
      await supabase
        .from("content_versions")
        .delete()
        .in(
          "id",
          oldVersions.map((v) => v.id)
        );
    }
  } catch (error) {
    console.error("Failed to save content version:", error);
  }
};
