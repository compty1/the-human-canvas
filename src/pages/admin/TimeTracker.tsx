import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear } from "date-fns";

interface WorkLog {
  id: string;
  project_id: string | null;
  date: string;
  hours: number;
  description: string | null;
  category: string;
  week_number: number;
  year: number;
  created_at: string;
  projects?: { title: string } | null;
}

interface Project {
  id: string;
  title: string;
}

const categories = ["development", "design", "research", "writing", "art", "admin", "other"];

const TimeTracker = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({
    project_id: "",
    hours: "",
    description: "",
    category: "development",
  });

  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 });

  // Fetch work logs for current week
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["work-logs", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_logs")
        .select("*, projects(title)")
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"))
        .order("date", { ascending: false });
      if (error) throw error;
      return data as WorkLog[];
    },
  });

  // Fetch all projects
  const { data: projects = [] } = useQuery({
    queryKey: ["all-projects-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data as Project[];
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async () => {
      const date = new Date(selectedDate);
      const { error } = await supabase.from("work_logs").insert({
        project_id: form.project_id || null,
        date: selectedDate,
        hours: parseFloat(form.hours),
        description: form.description || null,
        category: form.category,
        week_number: getWeek(date, { weekStartsOn: 1 }),
        year: getYear(date),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs"] });
      toast.success("Time logged");
      setForm({ project_id: "", hours: "", description: "", category: "development" });
    },
    onError: (error) => {
      toast.error("Failed to log time");
      console.error(error);
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs"] });
      toast.success("Log deleted");
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const hoursByCategory = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.hours;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display">Time Tracker</h1>
            <p className="text-muted-foreground">Log and track time spent on projects</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add Entry Form */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Log Time
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="project">Project (optional)</Label>
                <select
                  id="project"
                  value={form.project_id}
                  onChange={(e) => setForm(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="">No specific project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  value={form.hours}
                  onChange={(e) => setForm(prev => ({ ...prev, hours: e.target.value }))}
                  placeholder="1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <PopButton 
                onClick={() => addLogMutation.mutate()} 
                disabled={!form.hours || addLogMutation.isPending}
                className="w-full justify-center"
              >
                {addLogMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Log Time
              </PopButton>
            </div>
          </ComicPanel>

          {/* Week Overview */}
          <ComicPanel className="p-6 lg:col-span-2">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h2>

            {/* Week Navigation */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {weekDays.map((day) => {
                const dayLogs = logs.filter(l => l.date === format(day, "yyyy-MM-dd"));
                const dayTotal = dayLogs.reduce((sum, l) => sum + l.hours, 0);
                const isSelected = format(day, "yyyy-MM-dd") === selectedDate;
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(format(day, "yyyy-MM-dd"))}
                    className={`flex-1 min-w-[80px] p-3 border-2 text-center transition-colors ${
                      isSelected 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{format(day, "EEE")}</div>
                    <div className="text-lg font-display">{format(day, "d")}</div>
                    <div className="text-xs">{dayTotal > 0 ? `${dayTotal}h` : "-"}</div>
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-muted border-2 border-foreground text-center">
                <div className="text-2xl font-display">{totalHours}h</div>
                <div className="text-xs text-muted-foreground uppercase">Total This Week</div>
              </div>
              {Object.entries(hoursByCategory).slice(0, 3).map(([cat, hours]) => (
                <div key={cat} className="p-3 bg-muted border-2 border-foreground text-center">
                  <div className="text-2xl font-display">{hours}h</div>
                  <div className="text-xs text-muted-foreground uppercase">{cat}</div>
                </div>
              ))}
            </div>

            {/* Logs List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No time logged this week</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 border-2 border-foreground bg-background">
                    <div className="flex-shrink-0 text-center">
                      <div className="font-bold">{format(new Date(log.date), "EEE")}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(log.date), "MMM d")}</div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="font-bold truncate">
                        {log.projects?.title || "General"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {log.description || log.category}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-2 py-1 bg-muted text-xs font-bold uppercase">{log.category}</span>
                    </div>
                    <div className="flex-shrink-0 text-lg font-display">
                      {log.hours}h
                    </div>
                    <button
                      onClick={() => deleteLogMutation.mutate(log.id)}
                      className="flex-shrink-0 p-1 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ComicPanel>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TimeTracker;
