import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";

const categories = [
  { value: "technical", label: "Technical" }, { value: "creative", label: "Creative" },
  { value: "business", label: "Business" }, { value: "health", label: "Health" },
];
const statuses = [
  { value: "earned", label: "Earned" }, { value: "in_progress", label: "In Progress" },
  { value: "planned", label: "Planned" }, { value: "wanted", label: "Wanted" },
];

const CertificationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState({
    name: "", issuer: "", category: "technical", description: "", image_url: "",
    status: "planned", earned_date: "", expiration_date: "", credential_url: "",
    credential_id: "", estimated_cost: "", funded_amount: "", funding_enabled: true,
    skills: [] as string[], admin_notes: "", order_index: 0,
  });
  const [newSkill, setNewSkill] = useState("");
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

  const autosaveKey = `certification_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({ key: autosaveKey, data: form, enabled: true });
  useEditorShortcuts({ onSave: () => { saveMutation.mutate(); clearDraft(); }, onExit: () => navigate("/admin/certifications"), isDirty: historyIndex > 0 });

  const handleRestoreDraft = () => { const d = restoreDraft(); if (d) { setForm(d); setHistoryStack([d]); setHistoryIndex(0); toast.success("Draft restored"); } };

  const { data: certification, isLoading } = useQuery({
    queryKey: ["certification-edit", id || cloneId],
    queryFn: async () => { const tid = id || cloneId; if (!tid) return null; const { data, error } = await supabase.from("certifications").select("*").eq("id", tid).maybeSingle(); if (error) throw error; return data; },
    enabled: !!(id || cloneId),
  });

  useEffect(() => {
    if (certification) {
      const f = {
        name: cloneId ? `${certification.name} (Copy)` : certification.name || "",
        issuer: certification.issuer || "", category: certification.category || "technical",
        description: certification.description || "", image_url: certification.image_url || "",
        status: certification.status || "planned",
        earned_date: cloneId ? "" : certification.earned_date || "",
        expiration_date: cloneId ? "" : certification.expiration_date || "",
        credential_url: cloneId ? "" : certification.credential_url || "",
        credential_id: cloneId ? "" : certification.credential_id || "",
        estimated_cost: certification.estimated_cost?.toString() || "",
        funded_amount: cloneId ? "" : certification.funded_amount?.toString() || "",
        funding_enabled: certification.funding_enabled ?? true,
        skills: certification.skills || [], admin_notes: certification.admin_notes || "",
        order_index: certification.order_index || 0,
      };
      setForm(f); setHistoryStack([f]); setHistoryIndex(0);
    } else if (!isEditing && !cloneId) { setHistoryStack([form]); setHistoryIndex(0); }
  }, [certification]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...form, estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null, funded_amount: form.funded_amount ? parseFloat(form.funded_amount) : 0, earned_date: form.earned_date || null, expiration_date: form.expiration_date || null, credential_url: form.credential_url || null, credential_id: form.credential_id || null, image_url: form.image_url || null, description: form.description || null, admin_notes: form.admin_notes || null, category: form.category || null };
      if (isEditing) { const { error } = await supabase.from("certifications").update(data).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("certifications").insert(data); if (error) throw error; }
    },
    onSuccess: () => { clearDraft(); queryClient.invalidateQueries({ queryKey: ["admin-certifications"] }); queryClient.invalidateQueries({ queryKey: ["certifications"] }); toast.success(isEditing ? "Certification updated" : "Certification created"); navigate("/admin/certifications"); },
    onError: (error) => { toast.error("Failed to save"); console.error(error); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!id) return; const { error } = await supabase.from("certifications").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-certifications"] }); queryClient.invalidateQueries({ queryKey: ["certifications"] }); toast.success("Certification deleted"); navigate("/admin/certifications"); },
    onError: () => toast.error("Failed to delete"),
  });

  const addSkill = () => { if (newSkill && !form.skills.includes(newSkill)) { updateForm({ skills: [...form.skills, newSkill] }); setNewSkill(""); } };
  const removeSkill = (skill: string) => { updateForm({ skills: form.skills.filter(s => s !== skill) }); };

  if (isLoading) return (<AdminLayout><div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div></AdminLayout>);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {hasDraft && draftTimestamp && <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />}

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/certifications")} className="p-2 hover:bg-muted rounded"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-grow"><h1 className="text-3xl font-display">{isEditing ? "Edit Certification" : "Add Certification"}</h1></div>
          <KeyboardShortcutsHelp />
          <UndoRedoControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        </div>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Certification Details</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="e.g., AWS Solutions Architect" /></div>
              <div><Label>Issuer *</Label><Input value={form.issuer} onChange={(e) => updateForm({ issuer: e.target.value })} placeholder="e.g., Amazon Web Services" /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Category</Label><select value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full h-10 px-3 border-2 border-input bg-background">{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><Label>Status *</Label><select value={form.status} onChange={(e) => updateForm({ status: e.target.value })} className="w-full h-10 px-3 border-2 border-input bg-background">{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1"><Label>Description</Label><AIGenerateButton fieldName="description" fieldLabel="Description" contentType="certification" context={{ name: form.name, issuer: form.issuer, category: form.category }} currentValue={form.description} onGenerated={(v) => updateForm({ description: v })} variant="small" /></div>
              <Textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={3} />
            </div>
            <ImageUploader value={form.image_url} onChange={(url) => updateForm({ image_url: url })} label="Certificate Image" folder="certifications" />
          </div>
        </ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Credential Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Date Earned</Label><Input type="date" value={form.earned_date} onChange={(e) => updateForm({ earned_date: e.target.value })} /></div>
              <div><Label>Expiration Date</Label><Input type="date" value={form.expiration_date} onChange={(e) => updateForm({ expiration_date: e.target.value })} /></div>
            </div>
            <div><Label>Credential URL</Label><Input type="url" value={form.credential_url} onChange={(e) => updateForm({ credential_url: e.target.value })} /></div>
            <div><Label>Credential ID</Label><Input value={form.credential_id} onChange={(e) => updateForm({ credential_id: e.target.value })} /></div>
          </div>
        </ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Funding</h2>
          <div className="grid gap-4">
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.funding_enabled} onChange={(e) => updateForm({ funding_enabled: e.target.checked })} className="w-4 h-4" /><Label>Allow sponsorship</Label></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Estimated Cost ($)</Label><Input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => updateForm({ estimated_cost: e.target.value })} /></div>
              <div><Label>Funded Amount ($)</Label><Input type="number" step="0.01" value={form.funded_amount} onChange={(e) => updateForm({ funded_amount: e.target.value })} /></div>
            </div>
          </div>
        </ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Skills Covered</h2>
          <div className="flex gap-2 mb-3"><Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} /><PopButton size="sm" onClick={addSkill}><Plus className="w-4 h-4" /></PopButton></div>
          <div className="flex flex-wrap gap-2">{form.skills.map(s => <span key={s} className="px-3 py-1 bg-muted border-2 border-foreground flex items-center gap-2">{s}<button onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button></span>)}</div>
        </ComicPanel>

        <ComicPanel className="p-6"><h2 className="text-xl font-display mb-4">Admin Notes</h2><Textarea value={form.admin_notes} onChange={(e) => updateForm({ admin_notes: e.target.value })} rows={3} /></ComicPanel>

        <KnowledgeEntryWidget entityType="certification" entityId={isEditing ? id : undefined} />
        <ItemAIChatPanel entityType="certification" entityId={isEditing ? id : undefined} entityTitle={form.name || "New Certification"} context={`Issuer: ${form.issuer}\nCategory: ${form.category}\nStatus: ${form.status}`} />

        <div className="flex justify-between items-center">
          {isEditing && <PopButton variant="secondary" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 mr-2" /> Delete</PopButton>}
          <div className="flex gap-4 ml-auto">
            <PopButton variant="secondary" onClick={() => navigate("/admin/certifications")}>Cancel</PopButton>
            <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? "Update" : "Create"} Certification
            </PopButton>
          </div>
        </div>

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this certification?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default CertificationEditor;
