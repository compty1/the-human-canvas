import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, Heart, Music, Film, Book, Palette, Users, Star } from "lucide-react";
import { toast } from "sonner";

interface Favorite {
  id: string;
  title: string;
  type: string;
  source_url: string | null;
  image_url: string | null;
  creator_name: string | null;
  is_current: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  art: Palette,
  music: Music,
  movie: Film,
  book: Book,
  creator: Users,
  article: Book,
  research: Book,
  other: Star,
};

const typeColors: Record<string, string> = {
  art: "bg-pink-500",
  music: "bg-purple-500",
  movie: "bg-red-500",
  book: "bg-blue-500",
  creator: "bg-green-500",
  article: "bg-orange-500",
  research: "bg-cyan-500",
  other: "bg-gray-500",
};

const FavoritesManager = () => {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["admin-favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Favorite[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("favorites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-favorites"] });
      toast.success("Favorite deleted");
    },
  });

  const toggleCurrent = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("favorites")
      .update({ is_current: !currentValue })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to update");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-favorites"] });
      toast.success(currentValue ? "Removed from current" : "Marked as current");
    }
  };

  const byType = favorites.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const currentlyEnjoying = favorites.filter(f => f.is_current);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display flex items-center gap-3">
              <Heart className="w-10 h-10" />
              Favorites
            </h1>
            <p className="text-muted-foreground">Content you enjoy - art, music, movies, creators, and more</p>
          </div>
          <Link to="/admin/favorites/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Favorite
            </PopButton>
          </Link>
        </div>

        {/* Stats by Type */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(byType).map(([type, count]) => {
            const Icon = typeIcons[type] || Star;
            return (
              <div key={type} className={`px-4 py-2 text-white font-bold flex items-center gap-2 ${typeColors[type]}`}>
                <Icon className="w-4 h-4" />
                {type}: {count}
              </div>
            );
          })}
        </div>

        {/* Currently Enjoying */}
        {currentlyEnjoying.length > 0 && (
          <ComicPanel className="p-6 bg-pop-yellow/20">
            <h2 className="text-xl font-display mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" /> Currently Enjoying ({currentlyEnjoying.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {currentlyEnjoying.map((fav) => (
                <span key={fav.id} className="px-3 py-1 bg-pop-yellow font-bold text-sm">
                  {fav.title}
                </span>
              ))}
            </div>
          </ComicPanel>
        )}

        {/* All Favorites */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">Add content that inspires you</p>
            <Link to="/admin/favorites/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add First Favorite
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => {
              const Icon = typeIcons[fav.type] || Star;
              return (
                <ComicPanel key={fav.id} className="p-0 overflow-hidden">
                  {fav.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={fav.image_url}
                        alt={fav.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1 ${typeColors[fav.type]}`}>
                        <Icon className="w-3 h-3" />
                        {fav.type}
                      </span>
                      {fav.is_current && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-pop-yellow">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-display text-lg">{fav.title}</h3>
                    {fav.creator_name && (
                      <p className="text-sm text-muted-foreground">by {fav.creator_name}</p>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Link to={`/admin/favorites/${fav.id}/edit`}>
                        <button className="p-2 border-2 border-foreground hover:bg-muted">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => toggleCurrent(fav.id, fav.is_current)}
                        className={`p-2 border-2 border-foreground ${fav.is_current ? "bg-pop-yellow" : "hover:bg-muted"}`}
                        title={fav.is_current ? "Remove from current" : "Mark as current"}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this favorite?")) {
                            deleteMutation.mutate(fav.id);
                          }
                        }}
                        className="p-2 border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FavoritesManager;
