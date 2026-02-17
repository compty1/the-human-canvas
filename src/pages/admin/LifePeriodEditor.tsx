import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { RichTextEditor } from "@/components/editor";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, Image } from "lucide-react";
import { toast } from "sonner";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";

const LifePeriodEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
    detailed_content: "",
    themes: [] as string[],
    key_works: [] as string[],
    image_url: "",
    images: [] as string[], // Multiple images for gallery
    is_current: false,
    order_index: 0,
  });

  const [newTheme, setNewTheme] = useState("");

  // Fetch existing period
  const { data: period, isLoading } = useQuery({
    queryKey: ["life-period-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("life_periods")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch artwork and projects for key works selection
  const { data: artworks = [] } = useQuery({
    queryKey: ["all-artwork-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artwork")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["all-projects-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (period) {
      setForm({
        title: period.title || "",
        start_date: period.start_date || "",
        end_date: period.end_date || "",
        description: period.description || "",
        detailed_content: period.detailed_content || "",
        themes: period.themes || [],
        key_works: period.key_works || [],
        image_url: period.image_url || "",
        images: (period as Record<string, unknown>).images as string[] || [],
        is_current: period.is_current || false,
        order_index: period.order_index || 0,
      });
    }
  }, [period]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // If setting as current, first unset any other current periods
      if (form.is_current) {
        await supabase
          .from("life_periods")
          .update({ is_current: false })
          .eq("is_current", true)
          .neq("id", id || "");
      }

      const data = {
        title: form.title,
        start_date: form.start_date,
        end_date: form.end_date || null,
        description: form.description || null,
        detailed_content: form.detailed_content || null,
        themes: form.themes,
        key_works: form.key_works,
        image_url: form.image_url || null,
        images: form.images,
        is_current: form.is_current,
        order_index: form.order_index,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("life_periods")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("life_periods").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-life-periods"] });
      toast.success(isEditing ? "Period updated" : "Period added");
      navigate("/admin/life-periods");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  useEditorShortcuts({
    onSave: () => saveMutation.mutate(),
    onExit: () => navigate("/admin/life-periods"),
    isDirty: form.title !== (period?.title || ""),
  });

  const addTheme = () => {
    if (newTheme && !form.themes.includes(newTheme)) {
      setForm(prev => ({ ...prev, themes: [...prev.themes, newTheme] }));
      setNewTheme("");
    }
  };

  const toggleKeyWork = (workId: string) => {
    setForm(prev => ({
      ...prev,
      key_works: prev.key_works.includes(workId)
        ? prev.key_works.filter(id => id !== workId)
        : [...prev.key_works, workId],
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/life-periods")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Life Period" : "Add Life Period"}
            </h1>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="life_period"
          onImport={(data) => {
            if (data.title) setForm(prev => ({ ...prev, title: String(data.title) }));
            if (data.description) setForm(prev => ({ ...prev, description: String(data.description) }));
            if (data.detailed_content) setForm(prev => ({ ...prev, detailed_content: String(data.detailed_content) }));
            if (data.themes) setForm(prev => ({ ...prev, themes: Array.isArray(data.themes) ? data.themes : [] }));
          }}
        />

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Period Information</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., The Discovery Years, Art Awakening"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (leave empty if current)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={form.is_current}
                onChange={(e) => setForm(prev => ({ ...prev, is_current: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_current">This is the current period</Label>
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Cover Image"
              folder="life-periods"
            />
          </div>
        </ComicPanel>

        {/* Period Gallery Images */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5" />
            <h2 className="text-xl font-display">Gallery Images</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Add multiple images to showcase this period. These will appear in a gallery on the detail page.
          </p>
          <MultiImageUploader
            value={form.images}
            onChange={(urls) => setForm(prev => ({ ...prev, images: urls }))}
            label="Period Gallery"
            folder="life-periods/gallery"
            maxImages={12}
          />
        </ComicPanel>

        {/* Themes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Themes</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Key themes that defined this period (e.g., growth, struggle, transformation)
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.themes.map((theme) => (
              <span key={theme} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {theme}
                <button onClick={() => setForm(prev => ({ ...prev, themes: prev.themes.filter(t => t !== theme) }))}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              placeholder="Add theme..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
            />
            <button onClick={addTheme} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Detailed Content */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Detailed Content</h2>
          <RichTextEditor
            content={form.detailed_content}
            onChange={(content) => setForm(prev => ({ ...prev, detailed_content: content }))}
            placeholder="Write about this period in detail..."
          />
        </ComicPanel>

        {/* Key Works */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Key Works from This Period</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select artwork and projects that represent this period
          </p>
          
          <div className="space-y-4">
            {artworks.length > 0 && (
              <div>
                <Label className="mb-2 block">Artwork</Label>
                <div className="flex flex-wrap gap-2">
                  {artworks.slice(0, 10).map((art) => (
                    <button
                      key={art.id}
                      onClick={() => toggleKeyWork(art.id)}
                      className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${
                        form.key_works.includes(art.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-foreground hover:bg-muted"
                      }`}
                    >
                      {art.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <Label className="mb-2 block">Projects</Label>
                <div className="flex flex-wrap gap-2">
                  {projects.slice(0, 10).map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => toggleKeyWork(proj.id)}
                      className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${
                        form.key_works.includes(proj.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-foreground hover:bg-muted"
                      }`}
                    >
                      {proj.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ComicPanel>

        {/* AI Chat */}
        <ItemAIChatPanel
          entityType="life_period"
          entityId={isEditing ? id : undefined}
          entityTitle={form.title || "New Life Period"}
          context={`Dates: ${form.start_date} - ${form.end_date || "Present"}\nDescription: ${form.description}`}
        />

        {/* Save */}
        <div className="flex justify-end">
          <PopButton onClick={() => saveMutation.mutate()} disabled={!form.title || !form.start_date || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save"} Period
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LifePeriodEditor;
