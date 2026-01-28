import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ArtworkEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    category: "mixed",
    description: "",
    admin_notes: "",
  });

  const [generatingDesc, setGeneratingDesc] = useState(false);

  const { data: artwork, isLoading } = useQuery({
    queryKey: ["artwork-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("artwork")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (artwork) {
      setForm({
        title: artwork.title || "",
        image_url: artwork.image_url || "",
        category: artwork.category || "mixed",
        description: artwork.description || "",
        admin_notes: artwork.admin_notes || "",
      });
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
        setForm(prev => ({ ...prev, description: data.content }));
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
          <div>
            <h1 className="text-3xl font-display">{isEditing ? "Edit Artwork" : "Add Artwork"}</h1>
          </div>
        </div>

        {/* Form */}
        <ComicPanel className="p-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Artwork title"
              />
            </div>

            {/* Image Upload */}
            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Artwork Image *"
              folder="artwork"
            />

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 border-2 border-input bg-background"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="pop_art">Pop Art</option>
                <option value="graphic_design">Graphic Design</option>
                <option value="mixed">Mixed Media</option>
                <option value="photography">Photography</option>
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
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Describe this artwork..."
              />
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes (Private)</Label>
              <Textarea
                id="admin_notes"
                value={form.admin_notes}
                onChange={(e) => setForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
          </div>
        </ComicPanel>

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
