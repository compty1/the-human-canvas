import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, Image, Upload, MoreVertical, ExternalLink, ChevronRight } from "lucide-react";
import { BulkArtworkUploader } from "@/components/admin/BulkArtworkUploader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Local asset imports for resolving paths
import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";
import zacPortrait from "@/assets/artwork/zac-portrait.png";
import piece55 from "@/assets/artwork/piece-55.png";
import piece56 from "@/assets/artwork/piece-56.png";
import piece57 from "@/assets/artwork/piece-57.png";
import goldenHour from "@/assets/artwork/golden-hour.png";
import sailboat from "@/assets/artwork/sailboat.png";
import redBrick from "@/assets/artwork/red-brick.png";
import venicePalms from "@/assets/artwork/venice-palms.png";
import cemeteryStone from "@/assets/artwork/cemetery-stone.png";
import victorianMansion from "@/assets/artwork/victorian-mansion.png";
import hollywoodScene from "@/assets/artwork/hollywood-scene.png";
import anarchist from "@/assets/artwork/anarchist.png";
import harlequin from "@/assets/artwork/harlequin.png";
import bandagedPortrait from "@/assets/artwork/bandaged-portrait.png";

// Map local paths to resolved imports
const localAssetMap: Record<string, string> = {
  "/src/assets/artwork/moodboard-1.png": moodboard1,
  "/src/assets/artwork/moodboard-2.png": moodboard2,
  "/src/assets/artwork/nancy-sinatra.png": nancySinatra,
  "/src/assets/artwork/zac-portrait.png": zacPortrait,
  "/src/assets/artwork/piece-55.png": piece55,
  "/src/assets/artwork/piece-56.png": piece56,
  "/src/assets/artwork/piece-57.png": piece57,
  "/src/assets/artwork/golden-hour.png": goldenHour,
  "/src/assets/artwork/sailboat.png": sailboat,
  "/src/assets/artwork/red-brick.png": redBrick,
  "/src/assets/artwork/venice-palms.png": venicePalms,
  "/src/assets/artwork/cemetery-stone.png": cemeteryStone,
  "/src/assets/artwork/victorian-mansion.png": victorianMansion,
  "/src/assets/artwork/hollywood-scene.png": hollywoodScene,
  "/src/assets/artwork/anarchist.png": anarchist,
  "/src/assets/artwork/harlequin.png": harlequin,
  "/src/assets/artwork/bandaged-portrait.png": bandagedPortrait,
};

// All available categories
const ALL_CATEGORIES = [
  "portrait",
  "landscape",
  "photography",
  "mixed",
  "abstract",
  "digital",
  "traditional",
  "sketch",
  "colored",
  "pop_art",
  "graphic_design",
];

// Resolve image URL - converts local asset paths to imported modules
const resolveImageUrl = (url: string): string => {
  return localAssetMap[url] || url;
};

const ArtworkManager = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from("artwork")
        .update({ category })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
      toast.success("Category updated");
    },
    onError: () => {
      toast.error("Failed to update category");
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
        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <BulkArtworkUploader
            onComplete={() => {
              setShowBulkUpload(false);
              queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
            }}
            onCancel={() => setShowBulkUpload(false)}
          />
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Artwork</h1>
            <p className="text-muted-foreground">Manage your art gallery</p>
          </div>
          <div className="flex gap-2">
            <PopButton variant="secondary" onClick={() => setShowBulkUpload(true)}>
              <Upload className="w-4 h-4 mr-2" /> Bulk Upload
            </PopButton>
            <Link to="/admin/artwork/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add Artwork
              </PopButton>
            </Link>
          </div>
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
                  src={resolveImageUrl(art.image_url)} 
                  alt={art.title}
                  className="w-full aspect-square object-cover"
                />
                
                {/* Quick Options Dropdown */}
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-background/90 hover:bg-background border-2 border-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ChevronRight className="w-4 h-4 mr-2" />
                          Change Category
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {ALL_CATEGORIES.map((cat) => (
                            <DropdownMenuItem
                              key={cat}
                              onClick={() => updateCategoryMutation.mutate({ id: art.id, category: cat })}
                              className={art.category === cat ? "bg-muted" : ""}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                              {art.category === cat && " ✓"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/artwork/${art.id}/edit`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/gallery?artwork=${art.id}`} target="_blank" className="flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Site
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Delete this artwork?")) {
                            deleteMutation.mutate(art.id);
                          }
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 text-xs font-bold uppercase bg-background/90 border border-foreground">
                    {art.category || "uncategorized"}
                  </span>
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white font-display text-center">{art.title}</h3>
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