import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, ExternalLink, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

const ProductsManager = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-pop-green",
    draft: "bg-pop-yellow",
    archived: "bg-muted",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Products</h1>
            <p className="text-muted-foreground">Manage store products (Shopify-ready)</p>
          </div>
          <Link to="/admin/products/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </PopButton>
          </Link>
        </div>

        {/* Shopify Notice */}
        <ComicPanel className="p-4 bg-pop-cyan/10">
          <p className="text-sm">
            <strong>Shopify Integration:</strong> Products created here can be synced with Shopify when connected. 
            Cart and checkout will be handled by Shopify.
          </p>
        </ComicPanel>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-muted" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product) => (
              <ComicPanel key={product.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  {product.images && product.images.length > 0 ? (
                    <div className="w-16 h-16 flex-shrink-0 border-2 border-foreground overflow-hidden">
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 border-2 border-foreground bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {product.category && (
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {product.category}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase ${statusColors[product.status] || "bg-muted"}`}>
                        {product.status}
                      </span>
                    </div>
                    <h3 className="font-display text-lg truncate">{product.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${product.price}
                      </span>
                      {product.inventory_count !== null && (
                        <span>Stock: {product.inventory_count}</span>
                      )}
                      {product.shopify_product_id && (
                        <span className="text-pop-green font-bold">Synced with Shopify</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {product.status === "active" && (
                      <Link
                        to={`/store/${product.slug}`}
                        target="_blank"
                        className="p-2 hover:bg-muted"
                        title="View"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="p-2 hover:bg-muted"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No products yet.</p>
            <Link to="/admin/products/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </PopButton>
            </Link>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductsManager;
