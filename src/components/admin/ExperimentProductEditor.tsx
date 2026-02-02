import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Edit2, Trash2, Package, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ExperimentProduct {
  id: string;
  experiment_id: string;
  name: string;
  description: string | null;
  price: number | null;
  original_price: number | null;
  currency: string;
  quantity_sold: number;
  quantity_available: number;
  category: string | null;
  tags: string[] | null;
  materials: string[] | null;
  images: string[] | null;
  variations: Record<string, unknown>;
  sku: string | null;
  status: string;
  etsy_listing_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  experimentId: string;
}

const emptyProduct = {
  name: "",
  description: "",
  price: 0,
  original_price: null as number | null,
  quantity_sold: 0,
  quantity_available: 0,
  category: "",
  tags: [] as string[],
  materials: [] as string[],
  images: [] as string[],
  sku: "",
  status: "active",
  etsy_listing_id: "",
};

export const ExperimentProductEditor = ({ experimentId }: Props) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [newTag, setNewTag] = useState("");
  const [newMaterial, setNewMaterial] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["experiment-products", experimentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiment_products")
        .select("*")
        .eq("experiment_id", experimentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExperimentProduct[];
    },
    enabled: !!experimentId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        experiment_id: experimentId,
        name: form.name,
        description: form.description || null,
        price: form.price || null,
        original_price: form.original_price || null,
        quantity_sold: form.quantity_sold,
        quantity_available: form.quantity_available,
        category: form.category || null,
        tags: form.tags.length > 0 ? form.tags : null,
        materials: form.materials.length > 0 ? form.materials : null,
        images: form.images.length > 0 ? form.images : null,
        sku: form.sku || null,
        status: form.status,
        etsy_listing_id: form.etsy_listing_id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("experiment_products")
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experiment_products").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-products", experimentId] });
      toast.success(editingId ? "Product updated" : "Product added");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save product");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experiment_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-products", experimentId] });
      toast.success("Product deleted");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  const resetForm = () => {
    setForm(emptyProduct);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (product: ExperimentProduct) => {
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price || 0,
      original_price: product.original_price,
      quantity_sold: product.quantity_sold,
      quantity_available: product.quantity_available,
      category: product.category || "",
      tags: product.tags || [],
      materials: product.materials || [],
      images: product.images || [],
      sku: product.sku || "",
      status: product.status,
      etsy_listing_id: product.etsy_listing_id || "",
    });
    setEditingId(product.id);
    setIsAdding(true);
    setIsExpanded(true);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag("");
  };

  const removeTag = (index: number) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const addMaterial = () => {
    if (!newMaterial.trim()) return;
    setForm((prev) => ({ ...prev, materials: [...prev.materials, newMaterial.trim()] }));
    setNewMaterial("");
  };

  const removeMaterial = (index: number) => {
    setForm((prev) => ({ ...prev, materials: prev.materials.filter((_, i) => i !== index) }));
  };

  return (
    <ComicPanel className="p-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-display flex items-center gap-2">
          <Package className="w-5 h-5" />
          Products Catalog ({products.length})
        </h2>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Product List */}
          {isLoading ? (
            <div className="animate-pulse h-20 bg-muted" />
          ) : products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 border-2 border-border bg-card"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${product.price?.toFixed(2) || "0.00"} •{" "}
                      {product.quantity_sold} sold •{" "}
                      <span
                        className={
                          product.status === "active"
                            ? "text-pop-green"
                            : "text-muted-foreground"
                        }
                      >
                        {product.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(product)}
                      className="p-2 hover:bg-muted"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this product?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      className="p-2 hover:bg-destructive/10 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No products added yet.</p>
          )}

          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="border-2 border-dashed border-primary p-4 space-y-4">
              <h3 className="font-display text-lg">
                {editingId ? "Edit Product" : "Add New Product"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="product-name">Name *</Label>
                  <Input
                    id="product-name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Price ($)</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="product-original-price">Original Price ($)</Label>
                  <Input
                    id="product-original-price"
                    type="number"
                    step="0.01"
                    value={form.original_price || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        original_price: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="For showing discounts"
                  />
                </div>
                <div>
                  <Label htmlFor="product-qty-sold">Quantity Sold</Label>
                  <Input
                    id="product-qty-sold"
                    type="number"
                    value={form.quantity_sold}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, quantity_sold: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="product-qty-available">Quantity Available</Label>
                  <Input
                    id="product-qty-available"
                    type="number"
                    value={form.quantity_available}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantity_available: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">Category</Label>
                  <Input
                    id="product-category"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Vintage, Handmade, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="product-status">Status</Label>
                  <select
                    id="product-status"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <button onClick={addTag} className="p-2 border-2 border-foreground hover:bg-muted">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-muted text-sm flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(i)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <Label>Materials</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="Add material..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
                  />
                  <button
                    onClick={addMaterial}
                    className="p-2 border-2 border-foreground hover:bg-muted"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.materials.map((material, i) => (
                    <span key={i} className="px-2 py-1 bg-muted text-sm flex items-center gap-1">
                      {material}
                      <button onClick={() => removeMaterial(i)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>Product Images</Label>
                <MultiImageUploader
                  value={form.images}
                  onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
                  label="Product Images"
                  folder="experiment-products"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <PopButton
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !form.name}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Add Product"}
                </PopButton>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border-2 border-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAdding(true);
                setForm(emptyProduct);
              }}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-foreground hover:bg-muted w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      )}
    </ComicPanel>
  );
};
