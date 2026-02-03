import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Loader2, Sparkles, User, Lightbulb, Compass, Heart, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Inspiration {
  id: string;
  title: string;
  category: string;
  description: string | null;
  image_url: string | null;
  influence_areas: string[] | null;
  order_index: number;
  created_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  person: User,
  concept: Lightbulb,
  movement: Compass,
  experience: Heart,
};

const categoryColors: Record<string, string> = {
  person: "bg-blue-500",
  concept: "bg-purple-500",
  movement: "bg-green-500",
  experience: "bg-orange-500",
};

const InspirationsManager = () => {
  const queryClient = useQueryClient();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const { data: inspirations = [], isLoading } = useQuery({
    queryKey: ["admin-inspirations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspirations")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Inspiration[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inspirations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inspirations"] });
      toast.success("Inspiration deleted");
    },
  });

  const swapOrderMutation = useMutation({
    mutationFn: async ({ draggedId, targetId }: { draggedId: string; targetId: string }) => {
      const draggedItem = inspirations.find(i => i.id === draggedId);
      const targetItem = inspirations.find(i => i.id === targetId);
      
      if (!draggedItem || !targetItem) return;

      // Swap the order_index values
      const { error: error1 } = await supabase
        .from("inspirations")
        .update({ order_index: targetItem.order_index })
        .eq("id", draggedId);
      
      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("inspirations")
        .update({ order_index: draggedItem.order_index })
        .eq("id", targetId);
      
      if (error2) throw error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inspirations"] });
      toast.success("Order updated");
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData("text/plain");
    
    if (draggedItemId && draggedItemId !== targetId) {
      swapOrderMutation.mutate({ draggedId: draggedItemId, targetId });
    }
    
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const byCategory = inspirations.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display flex items-center gap-3">
              <Sparkles className="w-10 h-10" />
              Inspirations
            </h1>
            <p className="text-muted-foreground">People, concepts, movements, and experiences that inspire you</p>
          </div>
          <Link to="/admin/inspirations/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Inspiration
            </PopButton>
          </Link>
        </div>

        {/* Stats by Category */}
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(categoryIcons).map(([cat, Icon]) => (
            <ComicPanel key={cat} className={`p-4 text-center ${categoryColors[cat]} text-white`}>
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-display">{byCategory[cat] || 0}</div>
              <div className="text-sm capitalize">{cat}s</div>
            </ComicPanel>
          ))}
        </div>

        {/* Drag hint */}
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          Drag items to reorder. Items will swap positions automatically.
        </p>

        {/* Inspirations List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : inspirations.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No Inspirations Yet</h2>
            <p className="text-muted-foreground mb-6">Share what inspires your work</p>
            <Link to="/admin/inspirations/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add First Inspiration
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="space-y-2">
            {inspirations.map((insp, index) => {
              const Icon = categoryIcons[insp.category] || Sparkles;
              const isDragging = draggedId === insp.id;
              const isDragOver = dragOverId === insp.id;
              
              return (
                <ComicPanel 
                  key={insp.id} 
                  className={`p-4 transition-all ${
                    isDragging ? "opacity-50 scale-[0.98]" : ""
                  } ${
                    isDragOver ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, insp.id)}
                  onDragOver={(e) => handleDragOver(e, insp.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, insp.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded self-center">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    {insp.image_url && (
                      <img
                        src={insp.image_url}
                        alt={insp.title}
                        className="w-20 h-20 object-cover border-2 border-foreground flex-shrink-0"
                      />
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <span className={`px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1 ${categoryColors[insp.category]}`}>
                          <Icon className="w-3 h-3" />
                          {insp.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-display">{insp.title}</h3>
                      {insp.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{insp.description}</p>
                      )}
                      {insp.influence_areas && insp.influence_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {insp.influence_areas.map((area) => (
                            <span key={area} className="px-2 py-0.5 text-xs bg-muted font-bold">
                              {area}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={`/admin/inspirations/${insp.id}/edit`}>
                        <button className="p-2 border-2 border-foreground hover:bg-muted">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Delete this inspiration?")) {
                            deleteMutation.mutate(insp.id);
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

export default InspirationsManager;
