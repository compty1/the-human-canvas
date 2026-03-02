import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { RichTextEditor } from "@/components/editor";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";

const LIFE_PERIOD_CATEGORIES = [
  "Creative", "Professional", "Personal", "Educational", "Transitional", "Uncategorized",
];

const LifePeriodEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cloneId = searchParams.get("clone");
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
    images: [] as string[],
    is_current: false,
    order_index: 0,
    category: "uncategorized",
  });

  const [newTheme, setNewTheme] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Undo/Redo
  const [historyStack, setHistoryStack] = useState<typeof form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const pushToHistory = (newForm: typeof form) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newForm);
    if (newStack.length > 50) newStack.shift();
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(historyStack[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(historyStack[historyIndex + 1]);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushToHistory(newForm);
  };

  // Autosave
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({
    key: `life-period-${id || "new"}`,
    data: form,
    enabled: true,
  });

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

  // Clone support
  const { data: cloneSource } = useQuery({
    queryKey: ["life-period-clone", cloneId],
    queryFn: async () => {
      if (!cloneId) return null;
      const { data, error } = await supabase
        .from("life_periods")
        .select("*")
        .eq("id", cloneId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!cloneId && !isEditing,
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
    const source = period || cloneSource;
    if (source) {
      const initialForm = {
        title: cloneSource ? `${source.title} (Copy)` : source.title || "",
        start_date: source.start_date || "",
        end_date: source.end_date || "",
        description: source.description || "",
        detailed_content: source.detailed_content || "",
        themes: source.themes || [],
        key_works: source.key_works || [],
        image_url: source.image_url || "",
        images: (source as Record<string, unknown>).images as string[] || [],
        is_current: source.is_current || false,
        order_index: source.order_index || 0,
        category: (source as Record<string, unknown>).category as string || "uncategorized",
      };
      setForm(initialForm);
      setHistoryStack([initialForm]);
      setHistoryIndex(0);
    }
  }, [period, cloneSource]);

  const saveMutation = useMutation({
    mutationFn: async () => {
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
        category: form.category,
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
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["admin-life-periods"] });
      queryClient.invalidateQueries({ queryKey: ["life-periods"] });
      toast.success(isEditing ? "Period updated" : "Period added");
      navigate("/admin/life-periods");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("life_periods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["admin-life-periods"] });
      queryClient.invalidateQueries({ queryKey: ["life-periods"] });
      toast.success("Life period deleted");
      navigate("/admin/life-periods");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const { shortcuts } = useEditorShortcuts({
    onSave: () => saveMutation.mutate(),
    onExit: () => navigate("/admin/life-periods"),
    isDirty: form.title !== (period?.title || ""),
  });

  const addTheme = () => {
    if (newTheme && !form.themes.includes(newTheme)) {
      updateForm({ themes: [...form.themes, newTheme] });
      setNewTheme("");
    }
  };

  const toggleKeyWork = (workId: string) => {
    updateForm({
      key_works: form.key_works.includes(workId)
        ? form.key_works.filter(id => id !== workId)
        : [...form.key_works, workId],
    });
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
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Life Period" : "Add Life Period"}
            </h1>
          </div>
          <KeyboardShortcutsHelp />
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Draft Recovery */}
        {hasDraft && !isEditing && draftTimestamp && (
          <DraftRecoveryBanner
            timestamp={draftTimestamp}
            onRestore={() => {
              const draft = restoreDraft();
              if (draft) {
                setForm(draft);
                toast.success("Draft restored");
              }
            }}
            onDiscard={discardDraft}
          />
        )}

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="life_period"
          onImport={(data) => {
            const updates: Partial<typeof form> = {};
            if (data.title) updates.title = String(data.title);
            if (data.description) updates.description = String(data.description);
            if (data.detailed_content) updates.detailed_content = String(data.detailed_content);
            if (data.themes) updates.themes = Array.isArray(data.themes) ? data.themes : [];
            updateForm(updates);
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
                onChange={(e) => updateForm({ title: e.target.value })}
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
                  onChange={(e) => updateForm({ start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (leave empty if current)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateForm({ end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Short Description</Label>
                <AIGenerateButton
                  fieldName="description"
                  fieldLabel="Description"
                  contentType="life_period"
                  context={{ title: form.title, category: form.category, themes: form.themes }}
                  currentValue={form.description}
                  onGenerated={(value) => updateForm({ description: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={form.is_current}
                onChange={(e) => updateForm({ is_current: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_current">This is the current period</Label>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm({ category: e.target.value })}
                className="w-full h-10 px-3 border-2 border-input bg-background"
              >
                {LIFE_PERIOD_CATEGORIES.map((c) => (
                  <option key={c.toLowerCase()} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => updateForm({ image_url: url })}
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
            Add multiple images to showcase this period.
          </p>
          <EnhancedImageManager
            mainImage=""
            screenshots={form.images}
            onMainImageChange={() => {}}
            onScreenshotsChange={(urls) => updateForm({ images: urls })}
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
                <button onClick={() => updateForm({ themes: form.themes.filter(t => t !== theme) })}>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display">Detailed Content</h2>
            <AIGenerateButton
              fieldName="detailed_content"
              fieldLabel="Content"
              contentType="life_period"
              context={{ title: form.title, category: form.category, description: form.description, themes: form.themes }}
              currentValue={form.detailed_content}
              onGenerated={(value) => updateForm({ detailed_content: value })}
              variant="small"
            />
          </div>
          <RichTextEditor
            content={form.detailed_content}
            onChange={(content) => updateForm({ detailed_content: content })}
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

        {/* Knowledge Base */}
        <KnowledgeEntryWidget
          entityType="life_period"
          entityId={isEditing ? id : undefined}
        />

        {/* Save / Delete */}
        <div className="flex justify-between">
          {isEditing && (
            <PopButton variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </PopButton>
          )}
          <div className={!isEditing ? "ml-auto" : ""}>
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

        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Life Period?"
          description="This will permanently delete this life period entry."
        />
      </div>
    </AdminLayout>
  );
};

export default LifePeriodEditor;
