import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { MultiImageUploader } from "@/components/admin/ImageUploader";
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
import { Save, ArrowLeft, Plus, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState({
    name: "", slug: "", description: "", long_description: "",
    price: 0, compare_at_price: null as number | null, images: [] as string[],
    category: "", tags: [] as string[], inventory_count: 0, status: "draft",
    shopify_product_id: "", shopify_variant_id: "",
  });
  const [newTag, setNewTag] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const autosaveKey = `product_${id || "new"}`;
  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useAutosave({ key: autosaveKey, data: form, enabled: true });
  useEditorShortcuts({ onSave: () => { saveMutation.mutate(); clearDraft(); }, onExit: () => navigate("/admin/products"), isDirty: true });

  const handleRestoreDraft = () => { const d = restoreDraft(); if (d) { setForm(d); toast.success("Draft restored"); } };

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-edit", id || cloneId],
    queryFn: async () => { const tid = id || cloneId; if (!tid) return null; const { data, error } = await supabase.from("products").select("*").eq("id", tid).maybeSingle(); if (error) throw error; return data; },
    enabled: !!(id || cloneId),
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: cloneId ? `${product.name} (Copy)` : product.name || "",
        slug: cloneId ? "" : product.slug || "",
        description: product.description || "", long_description: product.long_description || "",
        price: product.price || 0, compare_at_price: product.compare_at_price,
        images: product.images || [], category: product.category || "",
        tags: product.tags || [], inventory_count: cloneId ? 0 : product.inventory_count || 0,
        status: cloneId ? "draft" : product.status || "draft",
        shopify_product_id: cloneId ? "" : product.shopify_product_id || "",
        shopify_variant_id: cloneId ? "" : product.shopify_variant_id || "",
      });
    }
  }, [product]);

  useEffect(() => {
    if (!isEditing && !cloneId && form.name) {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.name, isEditing, cloneId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { name: form.name, slug: form.slug, description: form.description || null, long_description: form.long_description || null, price: form.price, compare_at_price: form.compare_at_price, images: form.images, category: form.category || null, tags: form.tags, inventory_count: form.inventory_count, status: form.status, shopify_product_id: form.shopify_product_id || null, shopify_variant_id: form.shopify_variant_id || null };
      if (isEditing) { const { error } = await supabase.from("products").update(data).eq("id", id); if (error) throw error; }
      else { const { error } = await supabase.from("products").insert(data); if (error) throw error; }
    },
    onSuccess: async () => { if (isEditing && id) { await saveContentVersion("product", id, form as unknown as Record<string, unknown>); } clearDraft(); queryClient.invalidateQueries({ queryKey: ["admin-products"] }); queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success(isEditing ? "Product updated" : "Product created"); navigate("/admin/products"); },
    onError: (error) => { toast.error("Failed to save product"); console.error(error); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!id) return; const { error } = await supabase.from("products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Product deleted"); navigate("/admin/products"); },
    onError: () => toast.error("Failed to delete"),
  });

  const addTag = () => { if (!newTag.trim()) return; setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] })); setNewTag(""); };
  const removeTag = (index: number) => { setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) })); };

  if (isLoading) return (<AdminLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-muted w-48" /><div className="h-64 bg-muted" /></div></AdminLayout>);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {hasDraft && draftTimestamp && <DraftRecoveryBanner timestamp={draftTimestamp} onRestore={handleRestoreDraft} onDiscard={discardDraft} />}

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/products")} className="p-2 hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-3xl font-display flex-grow">{isEditing ? "Edit Product" : "Add Product"}</h1>
          <KeyboardShortcutsHelp />
          {isEditing && id && (
            <VersionHistory
              contentType="product"
              contentId={id}
              onRestore={(data) => setForm({ ...form, ...data } as typeof form)}
            />
          )}
        </div>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Basic Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g., Prints" /></div>
            <div><Label>Status</Label><select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full h-10 px-3 border-2 border-input bg-background"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
          </div>
          <div className="mt-4"><Label>Short Description</Label><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>
          <div className="mt-4"><Label>Full Description</Label><Textarea value={form.long_description} onChange={(e) => setForm(prev => ({ ...prev, long_description: e.target.value }))} rows={5} /></div>
        </ComicPanel>

        <ComicPanel className="p-6"><h2 className="text-xl font-display mb-4">Images</h2><MultiImageUploader value={form.images} onChange={(urls) => setForm(prev => ({ ...prev, images: urls }))} label="Product Images" folder="products" /></ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Pricing & Inventory</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Price ($) *</Label><Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} /></div>
            <div><Label>Compare at Price ($)</Label><Input type="number" step="0.01" min="0" value={form.compare_at_price || ""} onChange={(e) => setForm(prev => ({ ...prev, compare_at_price: parseFloat(e.target.value) || null }))} /></div>
            <div><Label>Inventory</Label><Input type="number" min="0" value={form.inventory_count} onChange={(e) => setForm(prev => ({ ...prev, inventory_count: parseInt(e.target.value) || 0 }))} /></div>
          </div>
        </ComicPanel>

        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Tags</h2>
          <div className="flex gap-2 mb-4"><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add a tag..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} /><button onClick={addTag} className="p-2 border-2 border-foreground hover:bg-muted"><Plus className="w-5 h-5" /></button></div>
          <div className="flex flex-wrap gap-2">{form.tags.map((tag, i) => <span key={i} className="px-3 py-1 bg-muted flex items-center gap-2">{tag}<button onClick={() => removeTag(i)}><X className="w-3 h-3" /></button></span>)}</div>
        </ComicPanel>

        {(form.shopify_product_id || form.shopify_variant_id) && (
          <ComicPanel className="p-6 bg-pop-green/10">
            <h2 className="text-xl font-display mb-4">Shopify Sync</h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div><Label>Shopify Product ID</Label><p className="font-mono bg-muted p-2">{form.shopify_product_id || "Not synced"}</p></div>
              <div><Label>Shopify Variant ID</Label><p className="font-mono bg-muted p-2">{form.shopify_variant_id || "Not synced"}</p></div>
            </div>
          </ComicPanel>
        )}

        <div className="flex justify-between items-center">
          {isEditing && <PopButton variant="secondary" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 mr-2" /> Delete</PopButton>}
          <div className="flex gap-4 ml-auto">
            <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.slug}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saveMutation.isPending ? "Saving..." : "Save Product"}
            </PopButton>
            <button onClick={() => navigate("/admin/products")} className="px-4 py-2 border-2 border-foreground hover:bg-muted">Cancel</button>
          </div>
        </div>

        <DeleteConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }} title="Delete this product?" description="This action cannot be undone." />
      </div>
    </AdminLayout>
  );
};

export default ProductEditor;
