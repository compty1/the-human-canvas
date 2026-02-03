import { useState, useRef, KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ComicPanel } from "@/components/pop-art";
import { Plus, X, Smile, Meh, Frown, Zap, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuickEntry {
  id: string;
  content: string;
  mood: string | null;
  tags: string[] | null;
  created_at: string;
}

const MOOD_OPTIONS = [
  { value: "energized", icon: Zap, label: "Energized" },
  { value: "happy", icon: Smile, label: "Happy" },
  { value: "neutral", icon: Meh, label: "Neutral" },
  { value: "tired", icon: Coffee, label: "Tired" },
  { value: "frustrated", icon: Frown, label: "Frustrated" },
];

interface QuickEntryWidgetProps {
  showTodayEntries?: boolean;
}

export const QuickEntryWidget = ({ showTodayEntries = true }: QuickEntryWidgetProps) => {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch today's entries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayEntries = [] } = useQuery({
    queryKey: ["quick-entries-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_entries")
        .select("*")
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuickEntry[];
    },
    enabled: showTodayEntries,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quick_entries").insert({
        content,
        mood,
        tags: tags.length > 0 ? tags : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-entries-today"] });
      setContent("");
      setMood(null);
      setTags([]);
      toast.success("Entry saved");
      inputRef.current?.focus();
    },
    onError: () => {
      toast.error("Failed to save entry");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-entries-today"] });
      toast.success("Entry deleted");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const getMoodIcon = (moodValue: string | null) => {
    const moodOption = MOOD_OPTIONS.find((m) => m.value === moodValue);
    return moodOption ? moodOption.icon : null;
  };

  return (
    <ComicPanel className="p-4">
      <div className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's happening?"
            className="flex-grow"
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createMutation.isPending}
            className="p-2 bg-primary text-primary-foreground border-2 border-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mood & Tags Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mood selector */}
          <div className="flex items-center gap-1">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setMood(mood === option.value ? null : option.value)}
                  className={`p-1.5 rounded transition-colors ${
                    mood === option.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Tag input */}
          <div className="flex items-center gap-2 flex-grow">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-muted"
              >
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag..."
              className="h-7 text-xs w-24"
            />
          </div>
        </div>

        {/* Today's Entries */}
        {showTodayEntries && todayEntries.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Today's entries
            </h4>
            <div className="space-y-2">
              {todayEntries.map((entry) => {
                const MoodIcon = getMoodIcon(entry.mood);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 p-2 bg-muted/50 text-sm group"
                  >
                    {MoodIcon && (
                      <MoodIcon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-grow min-w-0">
                      <p className="break-words">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[10px] bg-background"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "h:mm a")}
                      </span>
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ComicPanel>
  );
};
