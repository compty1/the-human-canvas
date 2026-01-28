import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, Image } from "lucide-react";
import { toast } from "sonner";

const ArtworkManager = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: artwork, isLoading } = useQuery({
    queryKey: ["admin-artwork"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artwork")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artwork").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
      toast.success("Artwork deleted");
    },
    onError: () => {
      toast.error("Failed to delete artwork");
    },
  });

  const categories = artwork 
    ? ["all", ...new Set(artwork.map(a => a.category || "uncategorized"))]
    : ["all"];

  const filteredArtwork = artwork?.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Artwork</h1>
            <p className="text-muted-foreground">Manage your art gallery</p>
          </div>
          <Link to="/admin/artwork/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Artwork
            </PopButton>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search artwork..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 text-sm font-bold uppercase border-2 border-foreground transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Artwork Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredArtwork && filteredArtwork.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredArtwork.map((art) => (
              <ComicPanel key={art.id} className="group relative overflow-hidden">
                <img 
                  src={art.image_url} 
                  alt={art.title}
                  className="w-full aspect-square object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                  <h3 className="text-background font-display text-center mb-1">{art.title}</h3>
                  <span className="text-xs text-background/70 uppercase mb-4">{art.category}</span>
                  
                  <div className="flex gap-2">
                    <Link 
                      to={`/admin/artwork/${art.id}/edit`}
                      className="p-2 bg-background text-foreground hover:bg-pop-cyan"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => {
                        if (confirm("Delete this artwork?")) {
                          deleteMutation.mutate(art.id);
                        }
                      }}
                      className="p-2 bg-background text-destructive hover:bg-destructive hover:text-background"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No artwork found</p>
            <Link to="/admin/artwork/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Artwork
              </PopButton>
            </Link>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default ArtworkManager;
