import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { VersionHistory, saveContentVersion } from "@/components/admin/VersionHistory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface FormState {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string;
  published: boolean;
}

const UpdateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    published: false,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<FormState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = (newForm: FormState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newForm);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(history[historyIndex + 1]);
    }
  };

  const updateForm = (updates: Partial<FormState>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushHistory(newForm);
  };

  // Autosave
  const autosaveKey = `update_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({
    key: autosaveKey,
    data: form,
    enabled: true,
  });

  // Keyboard shortcuts
  useEditorShortcuts({
    onSave: () => { saveMutation.mutate(); clearDraft(); },
    onSaveAndExit: () => { saveMutation.mutate(); clearDraft(); },
    onExit: () => navigate("/admin/updates"),
    isDirty: historyIndex > 0,
    enabled: true,
  });

  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setForm(restoredData);
      setHistory([restoredData]);
      setHistoryIndex(0);
      toast({ title: "Draft restored" });
    }
  };

  // Fetch existing update if editing or cloning
  const { data: existingUpdate, isLoading: isLoadingUpdate } = useQuery({
    queryKey: ["update-edit", id || cloneId],
    queryFn: async () => {
      const targetId = id || cloneId;
      if (!targetId) return null;
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(id || cloneId),
  });

  // Populate form when editing or cloning
  useEffect(() => {
    if (existingUpdate) {
      const initialForm: FormState = {
        title: cloneId ? `${existingUpdate.title} (Copy)` : existingUpdate.title,
        slug: cloneId ? "" : existingUpdate.slug,
        content: existingUpdate.content || "",
        excerpt: existingUpdate.excerpt || "",
        tags: existingUpdate.tags?.join(", ") || "",
        published: cloneId ? false : (existingUpdate.published || false),
      };
      setForm(initialForm);
      setHistory([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing && !cloneId) {
      setHistory([form]);
      setHistoryIndex(0);
    }
  }, [existingUpdate, isEditing, cloneId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && !cloneId && form.title && historyIndex <= 0) {
      const generatedSlug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setForm(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [form.title, isEditing, cloneId, historyIndex]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
        published: form.published,
      };

      if (isEditing) {
        const { error } = await supabase.from("updates").update(updateData).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("updates").insert(updateData);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      if (isEditing && id) {
        await saveContentVersion("update", id, form as unknown as Record<string, unknown>);
      }
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({
        title: isEditing ? "Update saved" : "Update created",
        description: form.published ? "Your update is now live." : "Your update has been saved as a draft.",
      });
      navigate("/admin/updates");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      toast({ title: "Update deleted", description: "The update has been removed." });
      navigate("/admin/updates");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoadingUpdate) {
    return (
      <AdminLayout>
        <div className="max-w-3xl">
          <div className="h-12 bg-muted animate-pulse mb-4" />
          <div className="h-64 bg-muted animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        {/* Draft Recovery */}
        {hasDraft && draftTimestamp && (
          <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/updates")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display flex-grow">
            {isEditing ? "Edit Update" : "New Update"}
          </h1>
          <KeyboardShortcutsHelp />
          {isEditing && id && (
            <VersionHistory
              contentType="update"
              contentId={id}
              onRestore={(data) => {
                const restored = {
                  title: String(data.title || ""),
                  slug: String(data.slug || ""),
                  content: String(data.content || ""),
                  excerpt: String(data.excerpt || ""),
                  tags: Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags || ""),
                  published: Boolean(data.published),
                };
                setForm(restored);
              }}
            />
          )}
          <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <div className="flex items-center gap-2">
            <Switch id="published" checked={form.published} onCheckedChange={(checked) => updateForm({ published: checked })} />
            <Label htmlFor="published" className="font-bold">{form.published ? "Published" : "Draft"}</Label>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="update"
          onImport={(data) => {
            const updates: Partial<FormState> = {};
            if (data.title) updates.title = String(data.title);
            if (data.content) updates.content = String(data.content);
            if (data.excerpt) updates.excerpt = String(data.excerpt);
            if (data.tags) updates.tags = Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags);
            updateForm(updates);
          }}
        />

        {/* Form */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Update Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} placeholder="Update title..." />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} placeholder="url-friendly-slug" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="excerpt">Excerpt</Label>
                <AIGenerateButton fieldName="excerpt" fieldLabel="Excerpt" contentType="update" context={{ title: form.title }} currentValue={form.excerpt} onGenerated={(value) => updateForm({ excerpt: value })} variant="small" />
              </div>
              <Input id="excerpt" value={form.excerpt} onChange={(e) => updateForm({ excerpt: e.target.value })} placeholder="Brief summary..." />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={form.tags} onChange={(e) => updateForm({ tags: e.target.value })} placeholder="philosophy, art, thoughts" />
            </div>
          </div>
        </ComicPanel>

        {/* Content */}
        <ComicPanel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-bold">Content</Label>
            <AIGenerateButton fieldName="content" fieldLabel="Content" contentType="update" context={{ title: form.title, excerpt: form.excerpt }} currentValue={form.content} onGenerated={(value) => updateForm({ content: value })} variant="small" />
          </div>
          <RichTextEditor content={form.content} onChange={(content) => updateForm({ content })} placeholder="Start writing your update..." />
        </ComicPanel>

        {/* Actions */}
        <div className="flex justify-between items-center">
          {isEditing && (
            <PopButton type="button" variant="secondary" onClick={() => setShowDeleteDialog(true)} disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </PopButton>
          )}
          <div className="flex gap-4 ml-auto">
            <PopButton type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.slug}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saveMutation.isPending ? "Saving..." : "Save"}
            </PopButton>
          </div>
        </div>

        {/* Knowledge Base */}
        <KnowledgeEntryWidget entityType="update" entityId={isEditing ? id : undefined} />

        {/* AI Chat */}
        <ItemAIChatPanel entityType="update" entityId={isEditing ? id : undefined} entityTitle={form.title || "New Update"} context={`Excerpt: ${form.excerpt}\nTags: ${form.tags}`} />

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this update?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default UpdateEditor;
