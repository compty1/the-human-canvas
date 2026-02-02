import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComicPanel } from "@/components/pop-art";
import { Package, Tag } from "lucide-react";

interface ExperimentProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  original_price: number | null;
  quantity_sold: number;
  category: string | null;
  tags: string[] | null;
  materials: string[] | null;
  images: string[] | null;
  status: string;
}

interface Props {
  experimentId: string;
}

export const ProductGallery = ({ experimentId }: Props) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["experiment-products-public", experimentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiment_products")
        .select("id, name, description, price, original_price, quantity_sold, category, tags, materials, images, status")
        .eq("experiment_id", experimentId)
        .order("quantity_sold", { ascending: false });
      if (error) throw error;
      return data as ExperimentProduct[];
    },
    enabled: !!experimentId,
  });

  if (isLoading) {
    return (
      <ComicPanel className="p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-muted mb-4" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted" />
            ))}
          </div>
        </div>
      </ComicPanel>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <ComicPanel className="p-6">
      <h2 className="text-2xl font-display mb-4 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Products Sold
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="border-2 border-foreground bg-card overflow-hidden group"
          >
            {/* Product Image */}
            {product.images?.[0] ? (
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg truncate">{product.name}</h3>
              
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-baseline gap-2">
                  {product.price !== null && (
                    <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                  )}
                  {product.original_price !== null && product.original_price > (product.price || 0) && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.quantity_sold > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {product.quantity_sold} sold
                  </span>
                )}
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {product.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-muted text-xs flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-muted-foreground">
                      +{product.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Status Badge */}
              {product.status === "sold" && (
                <div className="mt-3">
                  <span className="px-2 py-1 bg-pop-yellow text-xs font-bold uppercase">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ComicPanel>
  );
};
