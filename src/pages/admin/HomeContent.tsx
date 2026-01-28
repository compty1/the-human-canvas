import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const HomeContent = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    hero_title: "Creating Future Artifacts of Humanity",
    hero_subtitle: "Designer • Developer • Artist",
    hero_description: "",
    mission_statement: "",
    ticker_items: [] as string[],
    featured_project_ids: [] as string[],
  });
  const [newTickerItem, setNewTickerItem] = useState("");

  // Fetch existing content
  const { data: content, isLoading } = useQuery({
    queryKey: ["home-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", [
          "hero_title",
          "hero_subtitle", 
          "hero_description",
          "mission_statement",
          "ticker_items",
          "featured_project_ids"
        ]);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all projects for selection
  const { data: projects } = useQuery({
    queryKey: ["all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (content) {
      const contentMap = content.reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);

      setForm(prev => ({
        ...prev,
        hero_title: contentMap.hero_title || prev.hero_title,
        hero_subtitle: contentMap.hero_subtitle || prev.hero_subtitle,
        hero_description: contentMap.hero_description || prev.hero_description,
        mission_statement: contentMap.mission_statement || prev.mission_statement,
        ticker_items: contentMap.ticker_items ? JSON.parse(contentMap.ticker_items) : prev.ticker_items,
        featured_project_ids: contentMap.featured_project_ids ? JSON.parse(contentMap.featured_project_ids) : prev.featured_project_ids,
      }));
    }
  }, [content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = [
        { key: "hero_title", value: form.hero_title, type: "text" },
        { key: "hero_subtitle", value: form.hero_subtitle, type: "text" },
        { key: "hero_description", value: form.hero_description, type: "text" },
        { key: "mission_statement", value: form.mission_statement, type: "rich_text" },
        { key: "ticker_items", value: JSON.stringify(form.ticker_items), type: "json" },
        { key: "featured_project_ids", value: JSON.stringify(form.featured_project_ids), type: "json" },
      ];
      
      for (const entry of entries) {
        const { error } = await supabase
          .from("site_content")
          .upsert({
            section_key: entry.key,
            content_value: entry.value,
            content_type: entry.type as "text" | "rich_text" | "json" | "image",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "section_key",
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-content"] });
      toast.success("Home content saved");
    },
    onError: (error) => {
      toast.error("Failed to save content");
      console.error(error);
    },
  });

  const addTickerItem = () => {
    if (newTickerItem.trim()) {
      setForm(prev => ({
        ...prev,
        ticker_items: [...prev.ticker_items, newTickerItem.trim()],
      }));
      setNewTickerItem("");
    }
  };

  const removeTickerItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      ticker_items: prev.ticker_items.filter((_, i) => i !== index),
    }));
  };

  const toggleFeaturedProject = (projectId: string) => {
    setForm(prev => {
      if (prev.featured_project_ids.includes(projectId)) {
        return {
          ...prev,
          featured_project_ids: prev.featured_project_ids.filter(id => id !== projectId),
        };
      } else {
        return {
          ...prev,
          featured_project_ids: [...prev.featured_project_ids, projectId],
        };
      }
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display">Home Page Content</h1>
            <p className="text-muted-foreground">Customize your homepage sections</p>
          </div>
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </PopButton>
        </div>

        {/* Hero Section */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Hero Section</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input
                id="hero_title"
                value={form.hero_title}
                onChange={(e) => setForm(prev => ({ ...prev, hero_title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
              <Input
                id="hero_subtitle"
                value={form.hero_subtitle}
                onChange={(e) => setForm(prev => ({ ...prev, hero_subtitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="hero_description">Hero Description</Label>
              <Textarea
                id="hero_description"
                value={form.hero_description}
                onChange={(e) => setForm(prev => ({ ...prev, hero_description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Ticker */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Ticker Items</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These items scroll across the page in the ticker component
          </p>
          <div className="space-y-2 mb-4">
            {form.ticker_items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted border-2 border-foreground">
                <span className="flex-grow font-bold">{item}</span>
                <button onClick={() => removeTickerItem(index)} className="text-destructive hover:bg-destructive/10 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTickerItem}
              onChange={(e) => setNewTickerItem(e.target.value)}
              placeholder="Add ticker item..."
              onKeyDown={(e) => e.key === "Enter" && addTickerItem()}
            />
            <PopButton onClick={addTickerItem}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Featured Projects */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Featured Projects</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select projects to feature on the homepage
          </p>
          <div className="grid gap-2">
            {projects?.map((project) => (
              <label 
                key={project.id} 
                className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-colors ${
                  form.featured_project_ids.includes(project.id)
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.featured_project_ids.includes(project.id)}
                  onChange={() => toggleFeaturedProject(project.id)}
                  className="sr-only"
                />
                <span className="font-bold">{project.title}</span>
                <span className={`text-xs px-2 py-1 font-bold uppercase ${
                  project.status === "live" ? "bg-green-500" :
                  project.status === "in_progress" ? "bg-pop-yellow" :
                  "bg-muted"
                }`}>
                  {project.status}
                </span>
              </label>
            ))}
          </div>
        </ComicPanel>

        {/* Mission Statement */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Mission Statement</h2>
          <Textarea
            value={form.mission_statement}
            onChange={(e) => setForm(prev => ({ ...prev, mission_statement: e.target.value }))}
            rows={5}
            placeholder="Your mission statement or manifesto..."
          />
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default HomeContent;
