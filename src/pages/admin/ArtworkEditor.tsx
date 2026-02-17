import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";

const ArtworkEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    images: [] as string[],
    category: "mixed",
    description: "",
    admin_notes: "",
  });

  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Undo/Redo
  const [historyStack, setHistoryStack] = useState<typeof form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const pushToHistory = (newForm: typeof form) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newForm);
    if (newStack.length > 50) newStack.shift();
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(historyStack[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(historyStack[historyIndex + 1]);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushToHistory(newForm);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey && canRedo) redo();
        else if (!e.shiftKey && canUndo) undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, historyIndex, historyStack]);

  const { data: artwork, isLoading } = useQuery({
    queryKey: ["artwork-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("artwork")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (artwork) {
      const initialForm = {
        title: artwork.title || "",
        image_url: artwork.image_url || "",
        images: (artwork as any).images || [],
        category: artwork.category || "mixed",
        description: artwork.description || "",
        admin_notes: artwork.admin_notes || "",
      };
      setForm(initialForm);
      setHistoryStack([initialForm]);
      setHistoryIndex(0);
    }
  }, [artwork]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const { error } = await supabase
          .from("artwork")
          .update(form)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artwork").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
      queryClient.invalidateQueries({ queryKey: ["artwork-gallery"] });
      toast.success(isEditing ? "Artwork updated" : "Artwork added");
      navigate("/admin/artwork");
    },
    onError: (error) => {
      toast.error("Failed to save artwork");
      console.error(error);
    },
  });

  const generateDescription = async () => {
    if (!form.title) {
      toast.error("Please enter a title first");
      return;
    }

    setGeneratingDesc(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          type: "artwork_description",
          context: `Artwork title: ${form.title}, Category: ${form.category}`,
          tone: "creative",
          length: "short",
        },
      });

      if (error) throw error;

      if (data?.content) {
        updateForm({ description: data.content });
        toast.success("Description generated!");
      }
    } catch (error) {
      toast.error("Failed to generate description");
      console.error(error);
    } finally {
      setGeneratingDesc(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted w-48" />
          <div className="h-64 bg-muted" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/artwork")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">{isEditing ? "Edit Artwork" : "Add Artwork"}</h1>
          </div>
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Form */}
        <ComicPanel className="p-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="Artwork title"
              />
            </div>

            {/* Image Upload */}
            <ImageUploader
              value={form.image_url}
              onChange={(url) => updateForm({ image_url: url })}
              label="Artwork Image *"
              folder="artwork"
            />

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm({ category: e.target.value })}
                className="w-full h-10 px-3 border-2 border-input bg-background"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="pop_art">Pop Art</option>
                <option value="graphic_design">Graphic Design</option>
                <option value="mixed">Mixed Media</option>
                <option value="photography">Photography</option>
                <option value="sketch">Sketch</option>
                <option value="colored">Colored</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Description</Label>
                <button
                  onClick={generateDescription}
                  disabled={generatingDesc}
                  className="text-xs flex items-center gap-1 text-primary hover:underline"
                >
                  {generatingDesc ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generate with AI
                </button>
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={3}
                placeholder="Describe this artwork..."
              />
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes (Private)</Label>
              <Textarea
                id="admin_notes"
                value={form.admin_notes}
                onChange={(e) => updateForm({ admin_notes: e.target.value })}
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
          </div>
        </ComicPanel>

        {/* Process / Stage Images */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Process & Stage Images</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add photos of different stages, process shots, or alternate views
          </p>
          <EnhancedImageManager
            mainImage=""
            screenshots={form.images}
            onMainImageChange={() => {}}
            onScreenshotsChange={(urls) => updateForm({ images: urls })}
            folder="artwork/process"
            maxImages={20}
          />
        </ComicPanel>

        {/* Knowledge Base */}
        <KnowledgeEntryWidget
          entityType="artwork"
          entityId={isEditing ? id : undefined}
        />

        {/* AI Chat */}
        <ItemAIChatPanel
          entityType="artwork"
          entityId={isEditing ? id : undefined}
          entityTitle={form.title || "New Artwork"}
          context={`Category: ${form.category}\nDescription: ${form.description}`}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <PopButton 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending || !form.title || !form.image_url}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Artwork"}
          </PopButton>
          <button 
            onClick={() => navigate("/admin/artwork")} 
            className="px-4 py-2 border-2 border-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ArtworkEditor;
