import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, SpeechBubble } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Tag } from "lucide-react";

const Store = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <SpeechBubble className="inline-block mb-4">
            Shop!
          </SpeechBubble>
          <h1 className="text-5xl font-display mb-4">Store</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unique items, prints, and merchandise. Each purchase supports independent creative work.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="h-20 bg-muted/50 mt-2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} to={`/store/${product.slug}`}>
                <ComicPanel className="h-full hover:-translate-y-1 transition-transform group">
                  <div className="aspect-square overflow-hidden border-b-4 border-foreground bg-muted">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {product.category && (
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        {product.category}
                      </span>
                    )}
                    <h3 className="text-lg font-display mt-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-muted-foreground line-through">
                          ${product.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.inventory_count !== null && product.inventory_count <= 5 && product.inventory_count > 0 && (
                      <span className="text-xs text-pop-pink font-bold mt-2 inline-block">
                        Only {product.inventory_count} left!
                      </span>
                    )}
                    {product.inventory_count === 0 && (
                      <span className="text-xs text-muted-foreground font-bold mt-2 inline-block">
                        Sold Out
                      </span>
                    )}
                  </div>
                </ComicPanel>
              </Link>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center max-w-xl mx-auto">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground">
              The store is being set up. Check back soon for unique items and merchandise.
            </p>
          </ComicPanel>
        )}

        {/* Categories */}
        {products && products.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-display mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set(products.map((p) => p.category).filter(Boolean))].map((cat) => (
                <span
                  key={cat}
                  className="px-4 py-2 bg-muted font-bold text-sm border-2 border-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  <Tag className="w-4 h-4 inline mr-2" />
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Store;
