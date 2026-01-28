import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { FundingModal } from "@/components/funding";
import { ExternalLink, Heart, Package, Filter } from "lucide-react";

interface Supply {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price: number;
  funded_amount: number;
  priority: string;
  category: string;
  status: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-700 border-red-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-green-100 text-green-700 border-green-300",
};

const statusColors = {
  needed: "bg-orange-100 text-orange-700",
  partially_funded: "bg-blue-100 text-blue-700",
  funded: "bg-green-100 text-green-700",
  purchased: "bg-purple-100 text-purple-700",
};

const Supplies = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fundingItem, setFundingItem] = useState<Supply | null>(null);

  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ["supplies-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplies_needed")
        .select("*")
        .neq("status", "purchased")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Supply[];
    },
  });

  const categories = ["all", ...new Set(supplies.map((s) => s.category))];

  const filteredSupplies =
    selectedCategory === "all"
      ? supplies
      : supplies.filter((s) => s.category === selectedCategory);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Wishlist</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Supplies Needed
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Help fuel the creative journey! These are the tools and supplies
            needed to continue creating projects, art, and content.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-4 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 font-bold text-sm border-2 border-foreground transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supplies Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredSupplies.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No supplies needed in this category right now!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSupplies.map((supply) => {
                const progress =
                  supply.price > 0
                    ? (supply.funded_amount / supply.price) * 100
                    : 0;

                return (
                  <ComicPanel key={supply.id} className="p-0 overflow-hidden">
                    {/* Image */}
                    {supply.image_url && (
                      <div className="aspect-video bg-muted border-b-4 border-foreground overflow-hidden">
                        <img
                          src={supply.image_url}
                          alt={supply.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase border ${
                            priorityColors[supply.priority as keyof typeof priorityColors] ||
                            priorityColors.medium
                          }`}
                        >
                          {supply.priority} priority
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase ${
                            statusColors[supply.status as keyof typeof statusColors] ||
                            statusColors.needed
                          }`}
                        >
                          {supply.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-display mb-1">{supply.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {supply.description}
                      </p>

                      {/* Price & Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold">
                            ${supply.funded_amount.toFixed(0)} raised
                          </span>
                          <span className="text-muted-foreground">
                            ${supply.price.toFixed(0)} needed
                          </span>
                        </div>
                        <div className="h-2 bg-muted border border-foreground overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <PopButton
                          variant="primary"
                          size="sm"
                          className="flex-grow justify-center"
                          onClick={() => setFundingItem(supply)}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Donate
                        </PopButton>
                        {supply.product_url && (
                          <a
                            href={supply.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border-2 border-foreground hover:bg-muted transition-colors"
                            title="Buy for Shane"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </ComicPanel>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Donate",
                desc: "Contribute any amount toward a supply item",
              },
              {
                step: "2",
                title: "Or Buy Directly",
                desc: "Use the link to purchase the item directly",
              },
              {
                step: "3",
                title: "Enable Creation",
                desc: "Help fund the tools that fuel creativity",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-pop-yellow text-foreground text-2xl font-display">
                  {item.step}
                </div>
                <h3 className="text-xl font-display mb-2">{item.title}</h3>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Modal */}
      {fundingItem && (
        <FundingModal
          open={!!fundingItem}
          onOpenChange={() => setFundingItem(null)}
          title={`Donate toward: ${fundingItem.name}`}
          description={fundingItem.description || undefined}
          targetId={fundingItem.id}
          contributionType="supplies"
        />
      )}
    </Layout>
  );
};

export default Supplies;
