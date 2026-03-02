import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { VersionHistory, saveContentVersion } from "@/components/admin/VersionHistory";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";

const ArtworkEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState({
    title: "", image_url: "", images: [] as string[],
    category: "mixed", description: "", admin_notes: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Undo/Redo
  const [historyStack, setHistoryStack] = useState<typeof form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const pushToHistory = (newForm: typeof form) => { const s = historyStack.slice(0, historyIndex + 1); s.push(newForm); if (s.length > 50) s.shift(); setHistoryStack(s); setHistoryIndex(s.length - 1); };
  const undo = () => { if (canUndo) { setHistoryIndex(prev => prev - 1); setForm(historyStack[historyIndex - 1]); } };
  const redo = () => { if (canRedo) { setHistoryIndex(prev => prev + 1); setForm(historyStack[historyIndex + 1]); } };
  const updateForm = (updates: Partial<typeof form>) => { const f = { ...form, ...updates }; setForm(f); pushToHistory(f); };

  const autosaveKey = `artwork_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({ key: autosaveKey, data: form, enabled: true });
  useEditorShortcuts({ onSave: () => { saveMutation.mutate(); clearDraft(); }, onExit: () => navigate("/admin/artwork"), isDirty: historyIndex > 0 });

  const handleRestoreDraft = () => { const d = restoreDraft(); if (d) { setForm(d); setHistoryStack([d]); setHistoryIndex(0); toast.success("Draft restored"); } };

  const { data: artwork, isLoading } = useQuery({
    queryKey: ["artwork-edit", id || cloneId],
    queryFn: async () => { const tid = id || cloneId; if (!tid) return null; const { data, error } = await supabase.from("artwork").select("*").eq("id", tid).maybeSingle(); if (error) throw error; return data; },
    enabled: !!(id || cloneId),
  });

  useEffect(() => {
    if (artwork) {
      const f = {
        title: cloneId ? `${artwork.title} (Copy)` : artwork.title || "",
        image_url: artwork.image_url || "",
        images: (artwork as any).images || [],
        category: artwork.category || "mixed",
        description: artwork.description || "",
        admin_notes: artwork.admin_notes || "",
      };
      setForm(f); setHistoryStack([f]); setHistoryIndex(0);
    } else if (!isEditing && !cloneId) { setHistoryStack([form]); setHistoryIndex(0); }
  }, [artwork]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) { const { error } = await supabase.from("artwork").update(form).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("artwork").insert(form); if (error) throw error; }
    },
    onSuccess: async () => { if (isEditing && id) { await saveContentVersion("artwork", id, form as unknown as Record<string, unknown>); } clearDraft(); queryClient.invalidateQueries({ queryKey: ["admin-artwork"] }); queryClient.invalidateQueries({ queryKey: ["artwork-gallery"] }); toast.success(isEditing ? "Artwork updated" : "Artwork added"); navigate("/admin/artwork"); },
    onError: (error) => { toast.error("Failed to save artwork"); console.error(error); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!id) return; const { error } = await supabase.from("artwork").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-artwork"] }); queryClient.invalidateQueries({ queryKey: ["artwork-gallery"] }); toast.success("Artwork deleted"); navigate("/admin/artwork"); },
    onError: () => toast.error("Failed to delete"),
  });

  if (isLoading) return (<AdminLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-muted w-48" /><div className="h-64 bg-muted" /></div></AdminLayout>);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {hasDraft && draftTimestamp && <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />}

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/artwork")} className="p-2 hover:bg-muted rounded"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-grow"><h1 className="text-3xl font-display">{isEditing ? "Edit Artwork" : "Add Artwork"}</h1></div>
          <KeyboardShortcutsHelp />
          {isEditing && id && (
            <VersionHistory
              contentType="artwork"
              contentId={id}
              onRestore={(data) => setForm({ ...form, ...data } as typeof form)}
            />
          )}
          <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        </div>

        <ComicPanel className="p-6">
          <div className="grid gap-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => updateForm({ title: e.target.value })} placeholder="Artwork title" /></div>
            <ImageUploader value={form.image_url} onChange={(url) => updateForm({ image_url: url })} label="Artwork Image *" folder="artwork" />
            <div><Label>Category</Label><select value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full h-10 px-3 border-2 border-input bg-background">
              <option value="portrait">Portrait</option><option value="landscape">Landscape</option><option value="pop_art">Pop Art</option><option value="graphic_design">Graphic Design</option><option value="mixed">Mixed Media</option><option value="photography">Photography</option><option value="sketch">Sketch</option><option value="colored">Colored</option>
            </select></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <AIGenerateButton fieldName="description" fieldLabel="Description" contentType="artwork" context={{ title: form.title, category: form.category }} currentValue={form.description} onGenerated={(value) => updateForm({ description: value })} variant="small" />
              </div>
              <Textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={3} placeholder="Describe this artwork..." />
            </div>
            <div><Label>Admin Notes (Private)</Label><Textarea value={form.admin_notes} onChange={(e) => updateForm({ admin_notes: e.target.value })} rows={2} placeholder="Internal notes..." /></div>
          </div>
        </ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Process & Stage Images</h2>
          <EnhancedImageManager mainImage="" screenshots={form.images} onMainImageChange={() => {}} onScreenshotsChange={(urls) => updateForm({ images: urls })} folder="artwork/process" maxImages={20} />
        </ComicPanel>

        <KnowledgeEntryWidget entityType="artwork" entityId={isEditing ? id : undefined} />
        <ItemAIChatPanel entityType="artwork" entityId={isEditing ? id : undefined} entityTitle={form.title || "New Artwork"} context={`Category: ${form.category}\nDescription: ${form.description}`} />

        <div className="flex justify-between items-center">
          {isEditing && <PopButton variant="secondary" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 mr-2" /> Delete</PopButton>}
          <div className="flex gap-4 ml-auto">
            <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.image_url}>
              <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving..." : "Save Artwork"}
            </PopButton>
            <button onClick={() => navigate("/admin/artwork")} className="px-4 py-2 border-2 border-foreground hover:bg-muted">Cancel</button>
          </div>
        </div>

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this artwork?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default ArtworkEditor;
