import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
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
import { Slider } from "@/components/ui/slider";
import { Save, ArrowLeft, Loader2, Plus, X, Star, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ProductReviewEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const cloneId = searchParams.get("clone");

  const [formData, setFormData] = useState({
    product_name: "", company: "", slug: "", category: "Consumer Product",
    overall_rating: 5, summary: "", content: "",
    pain_points: [] as string[], strengths: [] as string[],
    technical_issues: [] as string[], improvement_suggestions: [] as string[],
    future_recommendations: [] as string[],
    featured_image: "", screenshots: [] as string[],
    published: false, admin_notes: "",
  });

  const [newPainPoint, setNewPainPoint] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newTechnicalIssue, setNewTechnicalIssue] = useState("");
  const [newImprovement, setNewImprovement] = useState("");
  const [newFutureRec, setNewFutureRec] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Autosave
  const autosaveKey = `product_review_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({ key: autosaveKey, data: formData, enabled: true });

  useEditorShortcuts({
    onSave: () => handleSave(),
    onSaveAndExit: () => handleSave(),
    onExit: () => navigate("/admin/product-reviews"),
    isDirty: true,
    enabled: true,
  });

  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) { setFormData(restoredData); toast.success("Draft restored"); }
  };

  const { data: review, isLoading } = useQuery({
    queryKey: ["product-review", id || cloneId],
    queryFn: async () => {
      const targetId = id || cloneId;
      if (!targetId) return null;
      const { data, error } = await supabase.from("product_reviews").select("*").eq("id", targetId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(id || cloneId),
  });

  useEffect(() => {
    if (review) {
      setFormData({
        product_name: cloneId ? `${review.product_name} (Copy)` : review.product_name || "",
        company: review.company || "",
        slug: cloneId ? "" : review.slug || "",
        category: review.category || "Consumer Product",
        overall_rating: review.overall_rating || 5,
        summary: review.summary || "",
        content: review.content || "",
        pain_points: review.pain_points || [],
        strengths: review.strengths || [],
        technical_issues: review.technical_issues || [],
        improvement_suggestions: review.improvement_suggestions || [],
        future_recommendations: review.future_recommendations || [],
        featured_image: review.featured_image || "",
        screenshots: review.screenshots || [],
        published: cloneId ? false : (review.published || false),
        admin_notes: review.admin_notes || "",
      });
    }
  }, [review]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = formData.slug || formData.product_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const payload = { ...formData, slug };
      if (isEditing) {
        const { error } = await supabase.from("product_reviews").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_reviews").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      if (isEditing && id) {
        await saveContentVersion("product_review", id, formData as unknown as Record<string, unknown>);
      }
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
      toast.success(isEditing ? "Review updated!" : "Review created!");
      navigate("/admin/product-reviews");
    },
    onError: (error) => { toast.error("Failed to save review"); console.error(error); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
      toast.success("Review deleted");
      navigate("/admin/product-reviews");
    },
    onError: (error) => { toast.error("Failed to delete"); console.error(error); },
  });

  const handleSave = async () => {
    if (!formData.product_name || !formData.company) { toast.error("Product name and company are required"); return; }
    setSaving(true);
    await saveMutation.mutateAsync();
    setSaving(false);
  };

  const addToList = (list: string[], setList: (items: string[]) => void, newItem: string, setNewItem: (val: string) => void) => {
    if (newItem.trim()) { setList([...list, newItem.trim()]); setNewItem(""); }
  };

  const removeFromList = (list: string[], setList: (items: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const reviewCategories = ["Medical Device", "Consumer Product", "Software", "Mobile App", "Web Service", "Hardware", "IoT Device"];

  if (isLoading) {
    return (<AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div></AdminLayout>);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {hasDraft && draftTimestamp && (
          <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/product-reviews")} className="p-2 hover:bg-muted rounded"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-grow"><h1 className="text-3xl font-display">{isEditing ? "Edit Product Review" : "New Product Review"}</h1></div>
          <KeyboardShortcutsHelp />
          {isEditing && id && (
            <VersionHistory
              contentType="product_review"
              contentId={id}
              onRestore={(data) => setFormData({ ...formData, ...data } as typeof formData)}
            />
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="published">Published</Label>
            <Switch id="published" checked={formData.published} onCheckedChange={(checked) => setFormData({ ...formData, published: checked })} />
          </div>
          <PopButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
          </PopButton>
        </div>

        {/* Bulk Text Import */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Bulk Text Import</h2>
          <BulkTextImporter contentType="product_review" onImport={(data) => {
            setFormData(prev => ({
              ...prev,
              product_name: (data.product_name as string) || prev.product_name,
              company: (data.company as string) || prev.company,
              summary: (data.summary as string) || prev.summary,
              content: (data.content as string) || prev.content,
              strengths: (data.strengths as string[]) || prev.strengths,
              pain_points: (data.pain_points as string[]) || prev.pain_points,
              improvement_suggestions: (data.improvement_suggestions as string[]) || prev.improvement_suggestions,
            }));
          }} />
        </ComicPanel>

        {/* AI Auto-Analyze */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">AI Auto-Analyze Product</h2>
          <div className="flex gap-4">
            <Input value={analyzeUrl} onChange={(e) => setAnalyzeUrl(e.target.value)} placeholder="https://product-website.com" className="flex-grow" />
            <PopButton onClick={async () => {
              if (!analyzeUrl) { toast.error("Please enter a URL"); return; }
              setAnalyzing(true);
              try {
                const { data, error } = await supabase.functions.invoke("analyze-product", { body: { url: analyzeUrl } });
                if (error) throw error;
                if (data) {
                  setFormData(prev => ({ ...prev, product_name: data.product_name || prev.product_name, company: data.company || prev.company, category: data.category || prev.category, overall_rating: data.overall_rating || prev.overall_rating, summary: data.summary || prev.summary, pain_points: data.pain_points || prev.pain_points, strengths: data.strengths || prev.strengths, technical_issues: data.technical_issues || prev.technical_issues, improvement_suggestions: data.improvement_suggestions || prev.improvement_suggestions, future_recommendations: data.future_recommendations || prev.future_recommendations }));
                  toast.success("Product analyzed!");
                }
              } catch { toast.error("Failed to analyze product"); } finally { setAnalyzing(false); }
            }} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Auto-Analyze
            </PopButton>
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Product Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Product Name *</Label><Input value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} /></div>
            <div><Label>Company *</Label><Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} /></div>
            <div><Label>Category</Label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border-2 border-foreground bg-background">{reviewCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
            <div><Label>URL Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated" /></div>
            <EnhancedImageManager mainImage={formData.featured_image} screenshots={formData.screenshots} onMainImageChange={(url) => setFormData({ ...formData, featured_image: url })} onScreenshotsChange={(urls) => setFormData({ ...formData, screenshots: urls })} folder="product-reviews" />
          </div>
        </ComicPanel>

        {/* Rating */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 flex items-center gap-2"><Star className="w-5 h-5" /> Overall Rating</h2>
          <div className="flex items-center gap-4">
            <Slider value={[formData.overall_rating]} onValueChange={([value]) => setFormData({ ...formData, overall_rating: value })} min={1} max={10} step={1} className="flex-grow" />
            <span className="text-3xl font-display w-16 text-center">{formData.overall_rating}/10</span>
          </div>
        </ComicPanel>

        {/* Summary */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Executive Summary</h2>
          <Textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Brief overview..." rows={4} />
        </ComicPanel>

        {/* List sections */}
        {([
          { title: "Strengths", color: "green", items: formData.strengths, setter: (items: string[]) => setFormData({ ...formData, strengths: items }), newVal: newStrength, setNew: setNewStrength },
          { title: "Pain Points", color: "orange", items: formData.pain_points, setter: (items: string[]) => setFormData({ ...formData, pain_points: items }), newVal: newPainPoint, setNew: setNewPainPoint },
          { title: "Technical Issues", color: "red", items: formData.technical_issues, setter: (items: string[]) => setFormData({ ...formData, technical_issues: items }), newVal: newTechnicalIssue, setNew: setNewTechnicalIssue },
          { title: "Improvement Suggestions", color: "blue", items: formData.improvement_suggestions, setter: (items: string[]) => setFormData({ ...formData, improvement_suggestions: items }), newVal: newImprovement, setNew: setNewImprovement },
          { title: "Future Recommendations", color: "purple", items: formData.future_recommendations, setter: (items: string[]) => setFormData({ ...formData, future_recommendations: items }), newVal: newFutureRec, setNew: setNewFutureRec },
        ] as const).map(({ title, color, items, setter, newVal, setNew }) => (
          <ComicPanel key={title} className="p-6">
            <h2 className={`text-xl font-display mb-4 text-${color}-600`}>{title}</h2>
            <div className="space-y-2 mb-4">
              {items.map((item, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 bg-${color}-50 border border-${color}-200 rounded`}>
                  <span className="flex-grow">{item}</span>
                  <button onClick={() => removeFromList(items, setter, i)}><X className="w-4 h-4 text-destructive" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newVal} onChange={(e) => setNew(e.target.value)} placeholder={`Add...`} onKeyDown={(e) => e.key === "Enter" && addToList(items, setter, newVal, setNew)} />
              <PopButton onClick={() => addToList(items, setter, newVal, setNew)}><Plus className="w-4 h-4" /></PopButton>
            </div>
          </ComicPanel>
        ))}

        {/* Full Content */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Full Review Content</h2>
          <RichTextEditor content={formData.content} onChange={(content) => setFormData({ ...formData, content })} placeholder="Write your detailed product review here..." />
        </ComicPanel>

        {/* Admin Notes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Admin Notes</h2>
          <Textarea value={formData.admin_notes} onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })} placeholder="Internal notes..." rows={3} />
        </ComicPanel>

        <KnowledgeEntryWidget entityType="product_review" entityId={isEditing ? id : undefined} />
        <ItemAIChatPanel entityType="product_review" entityId={isEditing ? id : undefined} entityTitle={formData.product_name || "New Review"} context={`Company: ${formData.company}\nCategory: ${formData.category}`} />

        {/* Actions */}
        <div className="flex justify-between items-center">
          {isEditing && (
            <PopButton variant="secondary" onClick={() => setShowDeleteDialog(true)} disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </PopButton>
          )}
          <div className="ml-auto">
            <PopButton onClick={handleSave} disabled={saving} size="lg">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditing ? "Update Review" : "Create Review"}
            </PopButton>
          </div>
        </div>

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this review?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default ProductReviewEditor;
