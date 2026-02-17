import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, SpeechBubble } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShoppingCart, Tag, Package } from "lucide-react";
import { useState } from "react";

const StoreProductDetail = () => {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted" />
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-square bg-muted" />
              <div className="space-y-4">
                <div className="h-12 bg-muted" />
                <div className="h-8 w-32 bg-muted" />
                <div className="h-32 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-display mb-4">Product Not Found</h1>
          <Link to="/store" className="text-primary hover:underline">
            Back to Store
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images || [];
  const isOutOfStock = product.inventory_count === 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <ComicPanel className="overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </ComicPanel>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 border-4 overflow-hidden ${
                      selectedImage === i ? "border-primary" : "border-foreground"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {product.category && (
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                {product.category}
              </span>
            )}

            <h1 className="text-4xl font-display">{product.name}</h1>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                  <SpeechBubble className="text-sm">
                    Save ${(product.compare_at_price - product.price).toFixed(2)}!
                  </SpeechBubble>
                </>
              )}
            </div>

            {/* Stock Status */}
            {isOutOfStock ? (
              <div className="p-4 bg-muted text-muted-foreground font-bold">
                Out of Stock
              </div>
            ) : product.inventory_count && product.inventory_count <= 5 ? (
              <div className="p-4 bg-pop-yellow/20 text-foreground font-bold">
                Only {product.inventory_count} left in stock!
              </div>
            ) : null}

            {/* Add to Cart - Placeholder for Shopify */}
            <ComicPanel className="p-6 bg-muted/50">
              <p className="text-muted-foreground mb-4">
                Store checkout coming soon! Connect with Shopify to enable purchases.
              </p>
              <PopButton disabled={isOutOfStock} className="w-full justify-center opacity-50">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </PopButton>
            </ComicPanel>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xl font-display mb-2">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.long_description && (
              <div className="prose prose-lg max-w-none">
                {product.long_description.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-muted text-sm font-bold flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreProductDetail;
