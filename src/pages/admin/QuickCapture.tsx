import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { QuickEntryWidget } from "@/components/admin/QuickEntryWidget";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useState } from "react";

interface QuickEntry {
  id: string;
  content: string;
  mood: string | null;
  tags: string[] | null;
  created_at: string;
  aggregated_to_update_id: string | null;
}

const QuickCapture = () => {
  const queryClient = useQueryClient();
  const [aggregating, setAggregating] = useState(false);

  // Fetch all entries not yet aggregated
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["quick-entries-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_entries")
        .select("*")
        .is("aggregated_to_update_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuickEntry[];
    },
  });

  // Group entries by week
  const entriesByWeek = entries.reduce((acc, entry) => {
    const weekStart = startOfWeek(new Date(entry.created_at), { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");
    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        weekEnd: endOfWeek(weekStart, { weekStartsOn: 1 }),
        entries: [],
      };
    }
    acc[weekKey].entries.push(entry);
    return acc;
  }, {} as Record<string, { weekStart: Date; weekEnd: Date; entries: QuickEntry[] }>);

  const aggregateWeek = async (weekKey: string, weekEntries: QuickEntry[]) => {
    setAggregating(true);
    try {
      // Generate summary using AI
      const entriesText = weekEntries
        .map((e) => `- ${e.content}${e.mood ? ` (${e.mood})` : ""}`)
        .join("\n");

      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "generate-copy",
        {
          body: {
            prompt: `Summarize these daily highlights into a cohesive weekly update. Be concise and engaging:\n\n${entriesText}`,
            field: "weekly_summary",
            type: "text",
          },
        }
      );

      if (aiError) throw aiError;

      // Create update
      const weekData = entriesByWeek[weekKey];
      const title = `Week of ${format(weekData.weekStart, "MMM d")} - ${format(weekData.weekEnd, "MMM d, yyyy")}`;
      const slug = `week-${format(weekData.weekStart, "yyyy-MM-dd")}`;

      const { data: updateData, error: updateError } = await supabase
        .from("updates")
        .insert({
          title,
          slug,
          content: aiData?.content || entriesText,
          excerpt: `Highlights from the week of ${format(weekData.weekStart, "MMMM d")}`,
          published: false,
        })
        .select("id")
        .single();

      if (updateError) throw updateError;

      // Mark entries as aggregated
      const entryIds = weekEntries.map((e) => e.id);
      const { error: linkError } = await supabase
        .from("quick_entries")
        .update({ aggregated_to_update_id: updateData.id })
        .in("id", entryIds);

      if (linkError) throw linkError;

      queryClient.invalidateQueries({ queryKey: ["quick-entries-pending"] });
      toast.success("Weekly update created! Review it in Updates.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create weekly update");
    } finally {
      setAggregating(false);
    }
  };

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-entries-pending"] });
      queryClient.invalidateQueries({ queryKey: ["quick-entries-today"] });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display">Quick Capture</h1>
          <p className="text-muted-foreground">
            Jot down thoughts, accomplishments, and highlights throughout the day
          </p>
        </div>

        {/* Quick Entry Widget */}
        <QuickEntryWidget showTodayEntries={true} />

        {/* Pending Entries by Week */}
        <div className="space-y-6">
          <h2 className="text-xl font-display">Pending Entries</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : Object.keys(entriesByWeek).length === 0 ? (
            <ComicPanel className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No pending entries</p>
              <p className="text-sm text-muted-foreground">
                Add some quick entries above
              </p>
            </ComicPanel>
          ) : (
            Object.entries(entriesByWeek)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([weekKey, weekData]) => (
                <ComicPanel key={weekKey} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display">
                      Week of {format(weekData.weekStart, "MMM d")} -{" "}
                      {format(weekData.weekEnd, "MMM d")}
                    </h3>
                    <PopButton
                      size="sm"
                      onClick={() => aggregateWeek(weekKey, weekData.entries)}
                      disabled={aggregating}
                    >
                      {aggregating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Create Update
                    </PopButton>
                  </div>
                  
                  <div className="space-y-2">
                    {weekData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-2 bg-muted/50 group"
                      >
                        <div className="flex-grow">
                          <p className="text-sm">{entry.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "EEE, MMM d 'at' h:mm a")}
                            </span>
                            {entry.mood && (
                              <span className="text-xs px-1.5 py-0.5 bg-background">
                                {entry.mood}
                              </span>
                            )}
                            {entry.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 bg-primary/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEntryMutation.mutate(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ComicPanel>
              ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default QuickCapture;
