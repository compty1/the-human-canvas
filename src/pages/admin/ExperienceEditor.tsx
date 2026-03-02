import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { VersionHistory, saveContentVersion } from "@/components/admin/VersionHistory";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft, Plus, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "technical", label: "Technical" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

const subcategories: Record<string, string[]> = {
  creative: ["Visual Art", "Design", "Writing", "Music", "Photography", "Crafts"],
  business: ["E-commerce", "Operations", "Marketing", "Sales", "Finance", "Strategy"],
  technical: ["Web Dev", "Analysis", "Data", "Systems", "Automation"],
  service: ["Tutoring", "Consulting", "Support", "Healthcare", "Notary"],
  other: ["Horticulture", "Restoration", "Research", "Advocacy"],
};

const ExperienceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState({
    title: "", slug: "", category: "creative", subcategory: "",
    description: "", long_description: "", image_url: "", screenshots: [] as string[],
    start_date: "", end_date: "", is_ongoing: false,
    skills_used: [] as string[], tools_used: [] as string[],
    key_achievements: [] as string[], lessons_learned: [] as string[],
    challenges_overcome: [] as string[],
    clients_served: "", revenue_generated: "", projects_completed: "",
    admin_notes: "", order_index: 0, published: true,
    is_experimentation: false, experimentation_goal: "",
  });

  const [newItem, setNewItem] = useState<Record<string, string>>({
    skills_used: "", tools_used: "", key_achievements: "", lessons_learned: "", challenges_overcome: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const undo = () => { if (canUndo) { setHistoryIndex(prev => prev - 1); setForm(historyStack[historyIndex - 1]); } };
  const redo = () => { if (canRedo) { setHistoryIndex(prev => prev + 1); setForm(historyStack[historyIndex + 1]); } };

  const updateForm = (updates: Partial<typeof form>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushToHistory(newForm);
  };

  // Autosave
  const autosaveKey = `experience_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({ key: autosaveKey, data: form, enabled: true });

  useEditorShortcuts({
    onSave: () => { saveMutation.mutate(); clearDraft(); },
    onSaveAndExit: () => { saveMutation.mutate(); clearDraft(); },
    onExit: () => navigate("/admin/experiences"),
    isDirty: historyIndex > 0,
    enabled: true,
  });

  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) { setForm(restoredData); setHistoryStack([restoredData]); setHistoryIndex(0); toast.success("Draft restored"); }
  };

  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience-edit", id || cloneId],
    queryFn: async () => {
      const targetId = id || cloneId;
      if (!targetId) return null;
      const { data, error } = await supabase.from("experiences").select("*").eq("id", targetId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(id || cloneId),
  });

  useEffect(() => {
    if (experience) {
      const initialForm = {
        title: cloneId ? `${experience.title} (Copy)` : experience.title || "",
        slug: cloneId ? "" : experience.slug || "",
        category: experience.category || "creative",
        subcategory: experience.subcategory || "",
        description: experience.description || "",
        long_description: experience.long_description || "",
        image_url: experience.image_url || "",
        screenshots: experience.screenshots || [],
        start_date: cloneId ? "" : experience.start_date || "",
        end_date: cloneId ? "" : experience.end_date || "",
        is_ongoing: experience.is_ongoing || false,
        skills_used: experience.skills_used || [],
        tools_used: experience.tools_used || [],
        key_achievements: experience.key_achievements || [],
        lessons_learned: experience.lessons_learned || [],
        challenges_overcome: experience.challenges_overcome || [],
        clients_served: cloneId ? "" : experience.clients_served?.toString() || "",
        revenue_generated: cloneId ? "" : experience.revenue_generated?.toString() || "",
        projects_completed: cloneId ? "" : experience.projects_completed?.toString() || "",
        admin_notes: experience.admin_notes || "",
        order_index: experience.order_index || 0,
        published: cloneId ? false : (experience.published ?? true),
        is_experimentation: experience.is_experimentation || false,
        experimentation_goal: experience.experimentation_goal || "",
      };
      setForm(initialForm);
      setHistoryStack([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing && !cloneId) {
      setHistoryStack([form]);
      setHistoryIndex(0);
    }
  }, [experience]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        clients_served: form.clients_served ? parseInt(form.clients_served) : null,
        revenue_generated: form.revenue_generated ? parseFloat(form.revenue_generated) : null,
        projects_completed: form.projects_completed ? parseInt(form.projects_completed) : null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        image_url: form.image_url || null, subcategory: form.subcategory || null,
        description: form.description || null, long_description: form.long_description || null,
        admin_notes: form.admin_notes || null, experimentation_goal: form.experimentation_goal || null,
      };
      if (isEditing) {
        const { error } = await supabase.from("experiences").update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experiences").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      if (isEditing && id) {
        await saveContentVersion("experience", id, form as unknown as Record<string, unknown>);
      }
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      toast.success(isEditing ? "Experience updated" : "Experience created");
      navigate("/admin/experiences");
    },
    onError: (error) => { toast.error("Failed to save"); console.error(error); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      toast.success("Experience deleted");
      navigate("/admin/experiences");
    },
    onError: (error) => { toast.error("Failed to delete"); console.error(error); },
  });

  const generateSlug = () => {
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    updateForm({ slug });
  };

  const addItem = (field: keyof typeof newItem) => {
    const value = newItem[field];
    const currentArray = form[field as keyof typeof form] as string[];
    if (value && Array.isArray(currentArray) && !currentArray.includes(value)) {
      updateForm({ [field]: [...currentArray, value] });
      setNewItem(prev => ({ ...prev, [field]: "" }));
    }
  };

  const removeItem = (field: keyof typeof form, value: string) => {
    updateForm({ [field]: (form[field] as string[]).filter(v => v !== value) });
  };

  if (isLoading) {
    return (<AdminLayout><div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div></AdminLayout>);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {hasDraft && draftTimestamp && (
          <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/experiences")} className="p-2 hover:bg-muted rounded"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-grow"><h1 className="text-3xl font-display">{isEditing ? "Edit Experience" : "Add Experience"}</h1></div>
          <KeyboardShortcutsHelp />
          {isEditing && id && (
            <VersionHistory
              contentType="experience"
              contentId={id}
              onRestore={(data) => setForm({ ...form, ...data } as typeof form)}
            />
          )}
          <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        </div>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Basic Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} onBlur={() => !form.slug && generateSlug()} placeholder="e.g., E-commerce on Etsy" />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input id="slug" value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} />
                  <button onClick={generateSlug} className="px-3 py-2 bg-muted hover:bg-accent border-2 border-foreground text-sm">Generate</button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select id="category" value={form.category} onChange={(e) => updateForm({ category: e.target.value, subcategory: "" })} className="w-full h-10 px-3 border-2 border-input bg-background">
                  {categories.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <select id="subcategory" value={form.subcategory} onChange={(e) => updateForm({ subcategory: e.target.value })} className="w-full h-10 px-3 border-2 border-input bg-background">
                  <option value="">Select...</option>
                  {(subcategories[form.category] || []).map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Short Description</Label>
                <AIGenerateButton fieldName="description" fieldLabel="Description" contentType="experience" context={{ title: form.title, category: form.category }} currentValue={form.description} onGenerated={(value) => updateForm({ description: value })} variant="small" />
              </div>
              <Textarea id="description" value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={2} placeholder="Brief overview" />
            </div>

            {/* Experimentation Toggle */}
            <div className="border-2 border-muted p-4 rounded space-y-3">
              <div className="flex items-center gap-3">
                <Switch id="is_experimentation" checked={form.is_experimentation} onCheckedChange={(checked) => updateForm({ is_experimentation: checked })} />
                <Label htmlFor="is_experimentation" className="font-bold">This was personal experimentation</Label>
              </div>
              {form.is_experimentation && (
                <div className="mt-3">
                  <Label>What were you trying to figure out?</Label>
                  <Textarea value={form.experimentation_goal} onChange={(e) => updateForm({ experimentation_goal: e.target.value })} placeholder="e.g., Learning how to make pottery..." rows={2} className="mt-1" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Full Description</Label>
                <AIGenerateButton fieldName="long_description" fieldLabel="Full Description" contentType="experience" context={{ title: form.title, category: form.category, description: form.description }} currentValue={form.long_description} onGenerated={(value) => updateForm({ long_description: value })} variant="small" />
              </div>
              <Textarea value={form.long_description} onChange={(e) => updateForm({ long_description: e.target.value })} rows={5} placeholder="Detailed description..." />
            </div>

            <EnhancedImageManager mainImage={form.image_url} screenshots={form.screenshots} onMainImageChange={(url) => updateForm({ image_url: url })} onScreenshotsChange={(urls) => updateForm({ screenshots: urls })} folder="experiences" />
          </div>
        </ComicPanel>

        {/* Time Period */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Time Period</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => updateForm({ start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => updateForm({ end_date: e.target.value })} disabled={form.is_ongoing} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_ongoing" checked={form.is_ongoing} onChange={(e) => updateForm({ is_ongoing: e.target.checked, end_date: e.target.checked ? "" : form.end_date })} className="w-4 h-4" />
              <Label htmlFor="is_ongoing">Ongoing</Label>
            </div>
          </div>
        </ComicPanel>

        {/* Skills & Tools */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Skills & Tools</h2>
          <div className="grid gap-6">
            {(["skills_used", "tools_used", "key_achievements", "lessons_learned", "challenges_overcome"] as const).map((field) => (
              <div key={field}>
                <Label>{field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={newItem[field]} onChange={(e) => setNewItem(prev => ({ ...prev, [field]: e.target.value }))} placeholder={`Add...`} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem(field))} />
                  <PopButton size="sm" onClick={() => addItem(field)}><Plus className="w-4 h-4" /></PopButton>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form[field] as string[]).map((item) => (
                    <span key={item} className="px-3 py-1 bg-muted border-2 border-foreground flex items-center gap-2">
                      {item}<button onClick={() => removeItem(field, item)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ComicPanel>

        {/* Metrics */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Metrics (Optional)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div><Label>Clients Served</Label><Input type="number" value={form.clients_served} onChange={(e) => updateForm({ clients_served: e.target.value })} /></div>
            <div><Label>Revenue Generated ($)</Label><Input type="number" step="0.01" value={form.revenue_generated} onChange={(e) => updateForm({ revenue_generated: e.target.value })} /></div>
            <div><Label>Projects Completed</Label><Input type="number" value={form.projects_completed} onChange={(e) => updateForm({ projects_completed: e.target.value })} /></div>
          </div>
        </ComicPanel>

        {/* Publishing */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Publishing</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={form.published} onChange={(e) => updateForm({ published: e.target.checked })} className="w-4 h-4" />
              <Label htmlFor="published">Published</Label>
            </div>
            <div><Label>Admin Notes (private)</Label><Textarea value={form.admin_notes} onChange={(e) => updateForm({ admin_notes: e.target.value })} rows={3} /></div>
          </div>
        </ComicPanel>

        <KnowledgeEntryWidget entityType="experience" entityId={isEditing ? id : undefined} />
        <ItemAIChatPanel entityType="experience" entityId={isEditing ? id : undefined} entityTitle={form.title || "New Experience"} context={`Category: ${form.category}\nDescription: ${form.description}`} />

        {/* Actions */}
        <div className="flex justify-between items-center">
          {isEditing && (
            <PopButton variant="secondary" onClick={() => setShowDeleteDialog(true)} disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </PopButton>
          )}
          <div className="flex gap-4 ml-auto">
            <PopButton variant="secondary" onClick={() => navigate("/admin/experiences")}>Cancel</PopButton>
            <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? "Update" : "Create"} Experience
            </PopButton>
          </div>
        </div>

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this experience?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default ExperienceEditor;
